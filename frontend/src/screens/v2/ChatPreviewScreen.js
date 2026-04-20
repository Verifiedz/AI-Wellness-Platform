/**
 * Wave D.4 verification — composes the chat sub-components with fixture data.
 *
 * Mounted at /?chatpreview=1&state=empty|conversation|sending|sessions
 *
 * Note: this previews the SUB-COMPONENTS. The real AIChatScreen uses
 * useFocusEffect / chatApi / AuthContext / useVoiceInput, which require the
 * full provider tree. The drawer needs a real React Navigation drawer
 * navigator — neither runs in dev preview.
 */

import React, { useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useV2Theme } from '../../theme/v2';
import { useTheme } from '../../context/ThemeContext';
import {
  ScreenScaffold,
  Text,
  IconButton,
  Blob,
} from '../../ui/v2';
import {
  BookmarksSimple,
  PencilSimple,
  BookmarkSimple,
} from 'phosphor-react-native';
import { MessageBubble } from './chat/MessageBubble';
import { EmptyChat } from './chat/EmptyChat';
import { ChatComposer } from './chat/ChatComposer';

const STATES = {
  empty: 'Empty',
  conversation: 'Convo',
  sending: 'Sending',
  sessions: 'Sessions',
};

const STUB_USER = 'Aria';

const STUB_MESSAGES = [
  {
    id: '1',
    role: 'user',
    message: 'I had a tough day at work today.',
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    role: 'assistant',
    message:
      'I’m sorry to hear that. Tough days can leave a real residue. Would you like to **breathe through it together**, or talk about what happened?',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    role: 'user',
    message: 'Talk about it, please.',
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    role: 'assistant',
    message:
      'Okay. Take a slow breath, and when you’re ready, share what felt heaviest about the day.',
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    role: 'user',
    message: 'My manager pulled me into a sudden review and I felt blindsided.',
    createdAt: new Date(Date.now() - 90 * 1000).toISOString(),
  },
];

const STUB_SESSIONS = [
  {
    sessionId: 'a1b2c3d4',
    title: 'Tough day at work',
    createdDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isBookmarked: false,
  },
  {
    sessionId: 'b2c3d4e5',
    title: 'Sleep felt restless',
    createdDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isBookmarked: true,
  },
  {
    sessionId: 'c3d4e5f6',
    title: 'Morning gratitude check-in',
    createdDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    isBookmarked: false,
  },
  {
    sessionId: 'd4e5f6g7',
    title: 'Letter to past self',
    createdDate: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    isBookmarked: true,
  },
];

function getInitial() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'conversation';
  const params = new URLSearchParams(window.location.search);
  return params.get('state') || 'conversation';
}

export function ChatPreviewScreen() {
  const v2 = useV2Theme();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [state, setState] = useState(getInitial);
  const [inputText, setInputText] = useState('');

  const noop = () => {};

  let body;
  if (state === 'empty') {
    body = <EmptyChat userName={STUB_USER} onSuggestion={noop} />;
  } else if (state === 'conversation' || state === 'sending') {
    body = (
      <View style={{ flex: 1, paddingHorizontal: 4, paddingTop: v2.spacing[4] }}>
        {STUB_MESSAGES.map((m) => (
          <MessageBubble
            key={m.id}
            item={m}
            isNew={false}
            onRetry={noop}
            onMoodSelect={noop}
            selectedMood={null}
            onStartBreathing={noop}
            onEscalationAction={noop}
          />
        ))}
        {state === 'sending' ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: v2.spacing[2],
              paddingVertical: v2.spacing[2],
            }}
          >
            <Blob size={18} />
            <Text variant="body-sm" color="secondary">
              Sakina is gathering a thought…
            </Text>
          </View>
        ) : null}
      </View>
    );
  } else {
    // sessions drawer
    body = <SessionsListPreview v2={v2} />;
  }

  const showComposer = state === 'conversation' || state === 'sending' || state === 'empty';

  return (
    <ScreenScaffold
      ambient
      ambientIntensity="subtle"
      paddingHorizontal={3}
      paddingTop={0}
      paddingBottom={0}
      scrollable={false}
    >
      <View style={{ flex: 1, paddingTop: v2.spacing[8] }}>{body}</View>

      {showComposer ? (
        <ChatComposer
          value={inputText}
          onChange={setInputText}
          onSend={() => setInputText('')}
          disabled={state === 'sending'}
        />
      ) : null}

      {/* Floating dev switcher */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'center' }}
      >
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            backgroundColor: v2.palette.bg.elevated,
            borderColor: v2.palette.border.subtle,
            borderWidth: 1,
            borderRadius: v2.radius.full,
            paddingHorizontal: 6,
            paddingVertical: 4,
          }}
        >
          {Object.entries(STATES).map(([key, label]) => {
            const active = key === state;
            return (
              <Pressable
                key={key}
                onPress={() => setState(key)}
                accessibilityRole="button"
                accessibilityLabel={`Show ${label}`}
                accessibilityState={{ selected: active }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: active ? v2.palette.primary : 'transparent',
                }}
              >
                <Text
                  variant="label"
                  style={{
                    color: active ? v2.palette.text.onPrimary : v2.palette.text.secondary,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={toggleDarkMode}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: v2.palette.bg.surface,
            }}
          >
            <Text variant="label">{isDarkMode ? 'DARK' : 'LIGHT'}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenScaffold>
  );
}

function SessionsListPreview({ v2 }) {
  return (
    <View style={{ flex: 1, paddingHorizontal: v2.spacing[4], paddingTop: v2.spacing[8] }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: v2.spacing[3],
        }}
      >
        <Text variant="display-lg">Chats</Text>
        <IconButton
          icon={BookmarksSimple}
          accessibilityLabel="Filter bookmarks"
          variant="solid"
          weight="duotone"
          onPress={() => {}}
        />
      </View>
      <View style={{ gap: v2.spacing[2] }}>
        {STUB_SESSIONS.map((s) => (
          <View
            key={s.sessionId}
            style={{
              backgroundColor: v2.palette.bg.surface,
              borderColor: v2.palette.border.subtle,
              borderWidth: 1,
              borderRadius: 16,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }} numberOfLines={1}>
                {s.title}
              </Text>
              <Text variant="caption" color="tertiary" style={{ marginTop: 4 }} numberOfLines={1}>
                {new Date(s.createdDate).toLocaleString()}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <PencilSimple size={18} color={v2.palette.text.tertiary} weight="duotone" />
              <BookmarkSimple
                size={18}
                color={s.isBookmarked ? v2.palette.warning : v2.palette.text.tertiary}
                weight={s.isBookmarked ? 'fill' : 'duotone'}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default ChatPreviewScreen;
