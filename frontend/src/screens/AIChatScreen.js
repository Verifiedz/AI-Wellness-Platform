import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  DeviceEventEmitter,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useAuth } from "../context/AuthContext";
import { chatApi } from "../services/chatApi";
import { Colors } from "../theme/colors";

function formatMessageTime(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AIChatScreen({ route, navigation }) {
  const { user } = useAuth();
  const listRef = useRef(null);
  const headerHeight = useHeaderHeight();

  const initialSessionId = route?.params?.sessionId ?? null;
  const forceNewAt = route?.params?.forceNewAt;
  const [activeSessionId, setActiveSessionId] = useState(initialSessionId);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(Boolean(initialSessionId));
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const screenTitle = useMemo(() => {
    if (!activeSessionId) return "New Chat";
    return `Session ${activeSessionId.slice(0, 8)}`;
  }, [activeSessionId]);

  useEffect(() => {
    navigation.setOptions({ title: screenTitle });
  }, [navigation, screenTitle]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd?.({ animated: true });
    });
  }, []);

  const loadHistory = useCallback(
    async (sessionId) => {
      if (!sessionId) {
        setMessages([]);
        return;
      }

      setIsLoadingHistory(true);
      setError("");
      const result = await chatApi.getSessionMessages(sessionId);
      setIsLoadingHistory(false);

      if (result.error) {
        setError(result.error || "Failed to load chat history.");
        return;
      }

      setMessages(result.data || []);
      scrollToBottom();
    },
    [scrollToBottom]
  );

  useEffect(() => {
    if (initialSessionId) {
      setActiveSessionId(initialSessionId);
      loadHistory(initialSessionId);
      return;
    }

    setActiveSessionId(null);
    setMessages([]);
    setError("");
    setIsLoadingHistory(false);
  }, [initialSessionId, forceNewAt, loadHistory]);

  const sendMessage = useCallback(async () => {
    const messageText = inputText.trim();
    if (!messageText || isSending) return;

    setError("");
    setIsSending(true);

    const optimisticMessage = {
      id: `tmp_${Date.now()}`,
      message: messageText,
      role: "user",
      isBookmarked: false,
      createdAt: new Date().toISOString(),
      isPending: true,
      failed: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText("");
    scrollToBottom();

    const response = await chatApi.sendMessage({
      messageRequest: messageText,
      context: "",
      sessionId: activeSessionId,
    });

    if (response.error || !response.data) {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === optimisticMessage.id
            ? { ...item, isPending: false, failed: true }
            : item
        )
      );
      setError(response.error || "Failed to send message.");
      setIsSending(false);
      return;
    }

    const nextSessionId = String(response.data.sessionId || activeSessionId || "");
    if (nextSessionId) {
      const wasNewSessionCreated = !activeSessionId;
      setActiveSessionId(nextSessionId);
      await loadHistory(nextSessionId);

      // Notify drawer/session list to refresh immediately after a brand new session is created.
      if (wasNewSessionCreated) {
        DeviceEventEmitter.emit("chat:session-created", { sessionId: nextSessionId });
      }
    }

    setIsSending(false);
  }, [activeSessionId, inputText, isSending, loadHistory, scrollToBottom]);

  const retryMessage = useCallback(
    (failedMessage) => {
      setInputText(failedMessage.message);
      setMessages((prev) => prev.filter((item) => item.id !== failedMessage.id));
    },
    []
  );

  const renderMessage = ({ item }) => {
    const isUser = item.role === "user";

    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : null]}>
            {item.message}
          </Text>
          <View style={styles.messageMetaRow}>
            <Text style={[styles.timestampText, isUser ? styles.userTimestamp : null]}>
              {formatMessageTime(item.createdAt)}
            </Text>

            {item.isPending ? (
              <ActivityIndicator size="small" color={isUser ? "#fff" : Colors.primary} />
            ) : item.failed ? (
              <TouchableOpacity onPress={() => retryMessage(item)}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
    >
      {isLoadingHistory ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.helperText}>Loading conversation...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centerContent}>
          <Ionicons name="chatbubbles-outline" size={56} color={Colors.textLight} />
          <Text style={styles.title}>AI Wellness Assistant</Text>
          <Text style={styles.subtitle}>
            {`Hi${user?.username ? ` ${user.username}` : ""}, ask anything about your wellness journey.`}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          style={styles.messagesList}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
          scrollIndicatorInsets={{ right: 1 }}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {isSending ? (
        <View style={styles.typingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.typingText}>Assistant is thinking...</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor={Colors.textLight}
          style={styles.input}
          multiline
          editable={!isSending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() || isSending ? styles.sendButtonDisabled : null,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isSending}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingBottom: 12,
    paddingRight: 14,
    gap: 10,
  },
  messagesList: {
    paddingRight: 6,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAssistant: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#fff",
  },
  messageMetaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  timestampText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  userTimestamp: {
    color: "rgba(255,255,255,0.85)",
  },
  retryText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: "600",
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 130,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    color: Colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    height: 42,
    width: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  typingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
  },
  helperText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    marginBottom: 4,
  },
});
