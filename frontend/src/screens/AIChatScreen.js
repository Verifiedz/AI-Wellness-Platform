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
  LayoutAnimation,
  UIManager,
  Animated,
  Easing,
  DeviceEventEmitter,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { Ionicons } from "@expo/vector-icons";
import { useHeaderHeight } from "@react-navigation/elements";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { chatApi } from "../services/chatApi";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function formatMessageTime(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AIChatScreen({ route, navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const Colors = colors;
  const styles = createStyles(Colors);
  const listRef = useRef(null);
  const headerHeight = useHeaderHeight();

  const initialSessionId = route?.params?.sessionId ?? null;
  const initialSessionName = route?.params?.sessionName ?? null;
  const forceNewAt = route?.params?.forceNewAt;
  const [activeSessionId, setActiveSessionId] = useState(initialSessionId);
  const [activeSessionName, setActiveSessionName] = useState(initialSessionName);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(Boolean(initialSessionId));
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const thinkingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoadingHistory && messages.length === 0) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isLoadingHistory, messages.length, fadeAnim]);

  useEffect(() => {
    if (isSending) {
      thinkingAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(thinkingAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(thinkingAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      thinkingAnim.stopAnimation();
    }
  }, [isSending, thinkingAnim]);

  const screenTitle = useMemo(() => {
    if (!activeSessionId) return "New Chat";
    if (activeSessionName) return activeSessionName;
    return `Session ${activeSessionId.slice(0, 8)}`;
  }, [activeSessionId, activeSessionName]);

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
      setActiveSessionName(initialSessionName);
      loadHistory(initialSessionId);
      return;
    }

    setActiveSessionId(null);
    setActiveSessionName(null);
    setMessages([]);
    setError("");
    setIsLoadingHistory(false);
  }, [initialSessionId, initialSessionName, forceNewAt, loadHistory]);

  const sendMessage = useCallback(async () => {
    const messageText = inputText.trim();
    if (!messageText || isSending) return;

    setError("");
    setIsSending(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

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

      if (wasNewSessionCreated) {
        const words = messageText.split(/\s+/).slice(0, 6).join(" ");
        setActiveSessionName(words);
      }

      await loadHistory(nextSessionId);

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

  const markdownStyles = useMemo(() => ({
    body: { color: Colors.text, fontSize: 15, lineHeight: 22 },
    heading1: { color: Colors.text, fontSize: 20, fontWeight: "700", marginVertical: 6 },
    heading2: { color: Colors.text, fontSize: 18, fontWeight: "700", marginVertical: 5 },
    heading3: { color: Colors.text, fontSize: 16, fontWeight: "600", marginVertical: 4 },
    strong: { fontWeight: "700" },
    em: { fontStyle: "italic" },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    list_item: { marginVertical: 2 },
    code_inline: {
      backgroundColor: Colors.background,
      color: Colors.primary,
      paddingHorizontal: 4,
      borderRadius: 4,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      fontSize: 13,
    },
    fence: {
      backgroundColor: Colors.background,
      borderColor: Colors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      marginVertical: 6,
    },
    code_block: {
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      fontSize: 13,
      color: Colors.text,
    },
    link: { color: Colors.primary, textDecorationLine: "underline" },
    paragraph: { marginTop: 0, marginBottom: 6 },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: Colors.primary,
      paddingLeft: 10,
      marginVertical: 6,
      backgroundColor: Colors.background,
      borderRadius: 4,
    },
  }), [Colors]);

  const renderMessage = ({ item }) => {
    const isUser = item.role === "user";

    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {isUser ? (
            <Text style={[styles.messageText, styles.userMessageText]}>
              {item.message}
            </Text>
          ) : (
            <Markdown style={markdownStyles}>{item.message}</Markdown>
          )}
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
        <Animated.View style={[styles.centerContent, { opacity: fadeAnim }]}>
          <Ionicons name="chatbubbles-outline" size={56} color={Colors.textLight} />
          <Text style={styles.title}>AI Wellness Assistant</Text>
          <Text style={styles.subtitle}>
            {`Hi${user?.username ? ` ${user.username}` : ""}, ask anything about your wellness journey.`}
          </Text>
        </Animated.View>
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
        <Animated.View style={[styles.typingRow, { opacity: thinkingAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.4, 1],
        }) }]}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.typingText}>Assistant is thinking...</Text>
        </Animated.View>
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

const createStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  messagesContent: {
    paddingBottom: 14,
    paddingHorizontal: 2,
    gap: 6,
  },
  messagesList: {
    flex: 1,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAssistant: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
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
    lineHeight: 22,
  },
  userMessageText: {
    color: "#fff",
  },
  messageMetaRow: {
    marginTop: 6,
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
    borderTopWidth: 0,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 130,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    color: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  sendButton: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  sendButtonDisabled: {
    backgroundColor: Colors.disabled,
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  typingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    marginTop: 18,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  helperText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
});
