import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  LayoutAnimation,
  UIManager,
  Animated,
  Easing,
  DeviceEventEmitter,
} from 'react-native';
import ReAnimated, { SlideInRight, SlideInLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { chatApi } from '../services/chatApi';
import { Logo } from '../components/Logo';
import { SuggestionChip } from '../components/SuggestionChip';
import { ChatMessageRenderer } from '../components/chat/ChatMessageRenderer';
import { VoiceInputButton } from '../components/VoiceInputButton';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { ChatSkeleton } from '../components/skeletons/ChatSkeleton';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SUGGESTIONS = [
  'How am I doing this week?',
  'Help me relax',
  'Give me a journal prompt',
  "I'm feeling stressed",
];

function formatMessageTime(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function TypingDots({ color }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -6,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={dotStyles.row}>
      {[dot1, dot2, dot3].map((d, i) => (
        <Animated.View
          key={i}
          style={[dotStyles.dot, { backgroundColor: color, transform: [{ translateY: d }] }]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

export function AIChatScreen({ route, navigation }) {
  const { user } = useAuth();
  const { colors, fonts } = useTheme();
  const listRef = useRef(null);
  const headerHeight = useHeaderHeight();

  const initialSessionId = route?.params?.sessionId ?? null;
  const initialSessionName = route?.params?.sessionName ?? null;
  const forceNewAt = route?.params?.forceNewAt;
  const [activeSessionId, setActiveSessionId] = useState(initialSessionId);
  const [activeSessionName, setActiveSessionName] = useState(initialSessionName);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(Boolean(initialSessionId));
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const [moodSelections, setMoodSelections] = useState({});
  const voice = useVoiceInput();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const historyLoadedCount = useRef(0);

  // Append voice transcript to input text when recognition stops
  useEffect(() => {
    if (!voice.isListening && voice.transcript) {
      setInputText((prev) => {
        const separator = prev.trim() ? ' ' : '';
        return prev + separator + voice.transcript;
      });
      voice.resetTranscript();
    }
  }, [voice.isListening, voice.transcript, voice.resetTranscript]);

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

  const screenTitle = useMemo(() => {
    if (!activeSessionId) return 'New Chat';
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
      setError('');
      const result = await chatApi.getSessionMessages(sessionId);
      setIsLoadingHistory(false);
      if (result.error) {
        setError(result.error || 'Failed to load chat history.');
        return;
      }
      const loaded = result.data || [];
      historyLoadedCount.current = loaded.length;
      setMessages(loaded);
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
    setMoodSelections({});
    setError('');
    setIsLoadingHistory(false);
  }, [initialSessionId, initialSessionName, forceNewAt, loadHistory]);

  const sendMessage = useCallback(
    async (overrideText) => {
      const messageText = (overrideText || inputText).trim();
      if (!messageText || isSending) return;

      setError('');
      setIsSending(true);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      const optimisticMessage = {
        id: `tmp_${Date.now()}`,
        message: messageText,
        role: 'user',
        isBookmarked: false,
        createdAt: new Date().toISOString(),
        isPending: true,
        failed: false,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setInputText('');
      scrollToBottom();

      const response = await chatApi.sendMessage({
        messageRequest: messageText,
        context: '',
        sessionId: activeSessionId,
      });

      if (response.error || !response.data) {
        setMessages((prev) =>
          prev.map((item) =>
            item.id === optimisticMessage.id ? { ...item, isPending: false, failed: true } : item
          )
        );
        setError(response.error || 'Failed to send message.');
        setIsSending(false);
        return;
      }

      const nextSessionId = String(response.data.sessionId || activeSessionId || '');
      if (nextSessionId) {
        const wasNewSessionCreated = !activeSessionId;
        setActiveSessionId(nextSessionId);
        if (wasNewSessionCreated) {
          const words = messageText.split(/\s+/).slice(0, 6).join(' ');
          setActiveSessionName(words);
        }
        await loadHistory(nextSessionId);
        if (wasNewSessionCreated) {
          DeviceEventEmitter.emit('chat:session-created', { sessionId: nextSessionId });
        }
      }
      setIsSending(false);
    },
    [activeSessionId, inputText, isSending, loadHistory, scrollToBottom]
  );

  const retryMessage = useCallback((failedMessage) => {
    setInputText(failedMessage.message);
    setMessages((prev) => prev.filter((item) => item.id !== failedMessage.id));
  }, []);

  const handleMoodSelect = useCallback(
    (messageId, moodId) => {
      setMoodSelections((prev) => ({ ...prev, [messageId]: moodId }));
      sendMessage(`I'm feeling ${moodId}`);
    },
    [sendMessage]
  );

  const handleStartBreathing = useCallback(() => {
    navigation.navigate('BreathingExercise');
  }, [navigation]);

  const handleEscalationAction = useCallback(
    (actionType) => {
      if (actionType === 'crisis') {
        DeviceEventEmitter.emit('crisis:open');
      } else if (actionType === 'professional') {
        navigation.getParent()?.getParent()?.navigate('Profile', {
          screen: 'ProfessionalDirectory',
        });
      } else if (actionType === 'peer') {
        navigation.getParent()?.getParent()?.navigate('Community', {
          screen: 'CommunityHome',
        });
      }
    },
    [navigation]
  );

  const markdownStyles = useMemo(
    () => ({
      body: { ...fonts.body, color: colors.text },
      heading1: { ...fonts.heading1, color: colors.text, marginVertical: 6 },
      heading2: { ...fonts.heading2, color: colors.text, marginVertical: 5 },
      heading3: { ...fonts.heading3, color: colors.text, marginVertical: 4 },
      strong: { fontWeight: '700' },
      em: { fontStyle: 'italic' },
      bullet_list: { marginVertical: 4 },
      ordered_list: { marginVertical: 4 },
      list_item: { marginVertical: 2 },
      code_inline: {
        backgroundColor: colors.background,
        color: colors.primary,
        paddingHorizontal: 4,
        borderRadius: 4,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 13,
      },
      fence: {
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginVertical: 6,
      },
      code_block: {
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 13,
        color: colors.text,
      },
      link: { color: colors.primary, textDecorationLine: 'underline' },
      paragraph: { marginTop: 0, marginBottom: 6 },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        paddingLeft: 10,
        marginVertical: 6,
        backgroundColor: colors.background,
        borderRadius: 4,
      },
    }),
    [colors, fonts]
  );

  const renderMessage = ({ item, index }) => {
    const isUser = item.role === 'user';
    const isNew = index >= historyLoadedCount.current;
    const entering = isNew
      ? isUser
        ? SlideInRight.duration(300)
        : SlideInLeft.duration(300)
      : undefined;

    const bubbleContent = (
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: colors.primary }]
            : [styles.assistantBubble, { backgroundColor: colors.surfaceElevated }],
        ]}
      >
        {isUser ? (
          <Text style={[fonts.body, { color: '#fff' }]}>{item.message}</Text>
        ) : (
          <ChatMessageRenderer
            message={item.message}
            markdownStyles={markdownStyles}
            onMoodSelect={(moodId) => handleMoodSelect(item.id, moodId)}
            selectedMood={moodSelections[item.id] ?? null}
            moodDisabled={moodSelections[item.id] != null}
            onStartBreathing={handleStartBreathing}
            onEscalationAction={handleEscalationAction}
          />
        )}
        <View style={styles.metaRow}>
          <Text
            style={[
              fonts.caption,
              { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
            ]}
          >
            {formatMessageTime(item.createdAt)}
          </Text>
          {item.isPending ? (
            <ActivityIndicator size="small" color={isUser ? '#fff' : colors.primary} />
          ) : item.failed ? (
            <TouchableOpacity onPress={() => retryMessage(item)}>
              <Text style={[fonts.caption, { color: colors.error, fontWeight: '600' }]}>Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );

    return entering ? (
      <ReAnimated.View
        entering={entering}
        style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}
      >
        {bubbleContent}
      </ReAnimated.View>
    ) : (
      <View
        style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}
      >
        {bubbleContent}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      {isLoadingHistory ? (
        <ChatSkeleton />
      ) : messages.length === 0 ? (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <Animated.View style={[styles.centerContent, { opacity: fadeAnim }]}>
            <Logo size="medium" showText={false} />
            <Text
              style={[fonts.heading2, { color: colors.text, marginTop: 20, textAlign: 'center' }]}
            >
              {`Hi${user?.username ? ` ${user.username}` : ''}, I'm your Sakina companion`}
            </Text>
            <Text
              style={[
                fonts.body,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 10,
                  paddingHorizontal: 10,
                },
              ]}
            >
              Ask me anything about your wellness journey
            </Text>
            <View style={styles.suggestionsWrap}>
              {SUGGESTIONS.map((s) => (
                <SuggestionChip key={s} label={s} onPress={() => sendMessage(s)} />
              ))}
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
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
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        />
      )}

      {isSending ? (
        <View style={styles.typingRow}>
          <TypingDots color={colors.primary} />
        </View>
      ) : null}

      {error ? (
        <Text
          style={[fonts.bodySmall, { color: colors.error, paddingHorizontal: 4, marginBottom: 4 }]}
        >
          {error}
        </Text>
      ) : null}

      <View style={styles.inputContainer}>
        {voice.isAvailable && (
          <VoiceInputButton
            isListening={voice.isListening}
            onPress={voice.isListening ? voice.stopListening : voice.startListening}
            disabled={isSending}
          />
        )}
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder={voice.isListening ? 'Listening...' : 'Type your message...'}
          placeholderTextColor={colors.textLight}
          style={[
            fonts.body,
            styles.input,
            { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          multiline
          editable={!isSending}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            {
              backgroundColor: !inputText.trim() || isSending ? colors.disabled : colors.primary,
            },
          ]}
          onPress={() => sendMessage()}
          disabled={!inputText.trim() || isSending}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 14, paddingTop: 8 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  messagesContent: { paddingBottom: 14, paddingHorizontal: 2, gap: 6 },
  messagesList: { flex: 1 },
  messageRow: { flexDirection: 'row', marginBottom: 6 },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAssistant: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '85%',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  userBubble: { borderBottomRightRadius: 6 },
  assistantBubble: { borderBottomLeftRadius: 6 },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 24,
    justifyContent: 'center',
  },
  typingRow: { paddingHorizontal: 4, marginBottom: 4 },
  inputContainer: {
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 130,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  sendBtn: {
    height: 48,
    width: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
