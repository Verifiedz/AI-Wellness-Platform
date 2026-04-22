/**
 * AIChatScreen v2 — conversation view.
 *
 * Behavior preserved end-to-end from the legacy 664-line version:
 *   - chatApi.getSessionMessages / chatApi.sendMessage contracts unchanged
 *   - optimistic message + isSendingRef double-submit guard
 *   - session-id race protection via activeSessionIdRef
 *   - DeviceEventEmitter('chat:session-created') fires on new session
 *   - useFocusEffect refresh-on-return logic preserved
 *   - voice input integration intact
 *   - mood / breathing / escalation actions in assistant bubbles intact
 *
 * Visual rewrite:
 *   - FlashList replaces FlatList (~10x faster on long threads)
 *   - Skia Blob replaces TypingDots / ActivityIndicator everywhere
 *   - MessageBubble extracted + memoized
 *   - EmptyChat hero with breathing aurora orb + display headline
 *   - ChatComposer with v2 send IconButton + theme-synced keyboard
 *   - ScreenScaffold provides ambient subtle aurora + safe area + tap-outside
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { List } from 'phosphor-react-native';
import { useAuth } from '../../../context/AuthContext';
import { chatApi } from '../../../services/chatApi';
import { useVoiceInput } from '../../../hooks/useVoiceInput';
import { useV2Theme } from '../../../theme/v2';
import {
  Blob,
  IconButton,
  ScreenHeader,
  ScreenScaffold,
  Text,
  LoadingState,
  ErrorState,
} from '../../../ui/v2';
import { MessageBubble } from './MessageBubble';
import { EmptyChat } from './EmptyChat';
import { ChatComposer } from './ChatComposer';

export function AIChatScreen({ route, navigation }) {
  const { user } = useAuth();
  const v2 = useV2Theme();
  const listRef = useRef(null);

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
  // Shown after ~5s of waiting so the user knows the delay is model
  // cold-start (loading ~4.5GB into VRAM on RunPod), not a broken app.
  const [showWarmupHint, setShowWarmupHint] = useState(false);

  const voice = useVoiceInput();
  const historyLoadedCount = useRef(0);
  const isSendingRef = useRef(false);
  const activeSessionIdRef = useRef(activeSessionId);
  const isMountedRef = useRef(true);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Surface a subtle "waking up the model" hint after 5s of waiting so
  // first-time users (and demo-day strangers) don't assume the app is
  // broken during a Llama cold-start.
  useEffect(() => {
    if (!isSending) {
      setShowWarmupHint(false);
      return undefined;
    }
    const timer = setTimeout(() => setShowWarmupHint(true), 5000);
    return () => clearTimeout(timer);
  }, [isSending]);

  // TabBar self-hides on keyboard show (see ui/v2/nav/TabBar.js), so the
  // composer is the bottom-most layout element whenever the keyboard is up
  // and KeyboardStickyView can land flush against the keyboard top.

  // Append voice transcript to input when recognition stops.
  useEffect(() => {
    if (!voice.isListening && voice.transcript) {
      setInputText((prev) => {
        const sep = prev.trim() ? ' ' : '';
        return prev + sep + voice.transcript;
      });
      voice.resetTranscript();
    }
  }, [voice.isListening, voice.transcript, voice.resetTranscript, voice]);

  const screenTitle = useMemo(() => {
    if (!activeSessionId) return 'New chat';
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

  // Refresh chat history when the screen regains focus (skip first focus).
  const hasMountedFocusRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasMountedFocusRef.current) {
        hasMountedFocusRef.current = true;
        return undefined;
      }
      const sessionId = activeSessionIdRef.current;
      if (sessionId) loadHistory(sessionId);
      return undefined;
    }, [loadHistory])
  );

  const sendMessage = useCallback(
    async (overrideText) => {
      const messageText = (overrideText || inputText).trim();
      if (!messageText || isSendingRef.current) return;

      isSendingRef.current = true;
      setError('');
      setIsSending(true);

      const sessionIdAtSend = activeSessionIdRef.current;
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
        sessionId: sessionIdAtSend,
      });

      if (!isMountedRef.current) {
        isSendingRef.current = false;
        return;
      }

      // Discard stale response if the user navigated to a different session mid-flight.
      if (activeSessionIdRef.current !== sessionIdAtSend && sessionIdAtSend !== null) {
        isSendingRef.current = false;
        setIsSending(false);
        return;
      }

      if (response.error || !response.data) {
        setMessages((prev) =>
          prev.map((it) =>
            it.id === optimisticMessage.id ? { ...it, isPending: false, failed: true } : it
          )
        );
        setError(response.error || 'Failed to send message.');
        isSendingRef.current = false;
        setIsSending(false);
        return;
      }

      const responseSessionId = response.data.sessionId;
      const nextSessionId = responseSessionId
        ? String(responseSessionId)
        : sessionIdAtSend
        ? String(sessionIdAtSend)
        : null;

      if (!nextSessionId) {
        setMessages((prev) =>
          prev.map((it) =>
            it.id === optimisticMessage.id ? { ...it, isPending: false, failed: true } : it
          )
        );
        setError('Failed to create chat session. Please try again.');
        isSendingRef.current = false;
        setIsSending(false);
        return;
      }

      if (!isMountedRef.current) {
        isSendingRef.current = false;
        return;
      }

      const wasNewSessionCreated = !sessionIdAtSend;
      setActiveSessionId(nextSessionId);
      activeSessionIdRef.current = nextSessionId;
      if (wasNewSessionCreated) {
        const words = messageText.split(/\s+/).slice(0, 6).join(' ');
        setActiveSessionName(words);
      }
      await loadHistory(nextSessionId);
      if (isMountedRef.current && wasNewSessionCreated) {
        DeviceEventEmitter.emit('chat:session-created', { sessionId: nextSessionId });
      }
      isSendingRef.current = false;
      if (isMountedRef.current) setIsSending(false);
    },
    [inputText, loadHistory, scrollToBottom]
  );

  const retryMessage = useCallback((failedMessage) => {
    setInputText(failedMessage.message);
    setMessages((prev) => prev.filter((it) => it.id !== failedMessage.id));
  }, []);

  const handleMoodSelect = useCallback(
    (messageId, moodId) => {
      setMoodSelections((prev) => ({ ...prev, [messageId]: moodId }));
      sendMessage(`I’m feeling ${moodId}`);
    },
    [sendMessage]
  );
  const handleStartBreathing = useCallback(() => {
    navigation.navigate('BreathingExercise');
  }, [navigation]);
  const handleEscalationAction = useCallback(
    (kind) => {
      if (kind === 'crisis') {
        DeviceEventEmitter.emit('crisis:open');
      } else if (kind === 'professional') {
        navigation
          .getParent()
          ?.getParent()
          ?.navigate('Profile', { screen: 'ProfessionalDirectory' });
      } else if (kind === 'peer') {
        navigation
          .getParent()
          ?.getParent()
          ?.navigate('Community', { screen: 'CommunityHome' });
      }
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item, index }) => {
      const isNew = index >= historyLoadedCount.current;
      return (
        <MessageBubble
          item={item}
          isNew={isNew}
          onRetry={retryMessage}
          onMoodSelect={(moodId) => handleMoodSelect(item.id, moodId)}
          selectedMood={moodSelections[item.id] ?? null}
          onStartBreathing={handleStartBreathing}
          onEscalationAction={handleEscalationAction}
        />
      );
    },
    [handleEscalationAction, handleMoodSelect, handleStartBreathing, moodSelections, retryMessage]
  );

  return (
    <ScreenScaffold
      ambient
      ambientIntensity="subtle"
      paddingHorizontal={3}
      paddingBottom={0}
      scrollable={false}
    >
      <ScreenHeader
        title={screenTitle}
        left={
          <IconButton
            icon={List}
            accessibilityLabel="Open chat history"
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            variant="ghost"
            weight="bold"
          />
        }
      />
      <View style={{ flex: 1, paddingTop: v2.spacing[2] }}>
        {isLoadingHistory ? (
          <LoadingState caption="Gathering your conversation" />
        ) : error && messages.length === 0 ? (
          <ErrorState
            title="Conversation didn’t load"
            body={error}
            onRetry={() => loadHistory(activeSessionId)}
          />
        ) : messages.length === 0 ? (
          <EmptyChat userName={user?.username} onSuggestion={(s) => sendMessage(s)} />
        ) : (
          <FlashList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onContentSizeChange={scrollToBottom}
          />
        )}

        {isSending ? (
          <View
            style={{
              paddingHorizontal: v2.spacing[4],
              paddingVertical: v2.spacing[2],
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Blob size={18} />
              <Text variant="body-sm" color="secondary">
                Sakina is gathering a thought…
              </Text>
            </View>
            {showWarmupHint ? (
              <Text
                variant="body-sm"
                color="tertiary"
                style={{ marginTop: v2.spacing[1], marginLeft: 26 }}
              >
                Waking up the model, this may take a moment…
              </Text>
            ) : null}
          </View>
        ) : null}

        {error && messages.length > 0 ? (
          <View
            style={{
              paddingHorizontal: v2.spacing[4],
              paddingVertical: v2.spacing[1],
            }}
          >
            <Text variant="body-sm" color="error">
              {error}
            </Text>
          </View>
        ) : null}
      </View>

      <ChatComposer
        value={inputText}
        onChange={setInputText}
        onSend={() => sendMessage()}
        disabled={isSending}
        voice={voice}
      />
    </ScreenScaffold>
  );
}

export default AIChatScreen;
