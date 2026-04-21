/**
 * Chat drawer — paginated FlashList of sessions + search dock + bookmark filter
 * + new-chat FAB + rename Sheet.
 *
 * Behavior preserved from legacy ChatStack drawer:
 *   - chatApi.getSessions / chatApi.setSessionBookmark / chatApi.deleteSession
 *   - AsyncStorage 'chat_session_names_v1' for local rename overrides
 *   - DeviceEventEmitter('chat:session-created') triggers reload
 *   - useFocusEffect + drawerOpen reload triggers
 *   - Swipe-to-delete with Alert confirmation
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, DeviceEventEmitter, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import {
  MagnifyingGlass,
  BookmarksSimple,
  Plus,
  PencilSimple,
} from 'phosphor-react-native';
import { TextInput } from 'react-native';
import { chatApi } from '../../../services/chatApi';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  EmptyState,
  IconButton,
  ScreenScaffold,
  Sheet,
  Text,
  Toast,
} from '../../../ui/v2';
import { Input } from '../../../ui/v2';
import { SessionItem } from './SessionItem';

const SESSION_NAMES_KEY = 'chat_session_names_v1';
const CHAT_ROUTE = 'AIChatConversation';

function defaultTitle(sessionId) {
  return `Session ${sessionId.slice(0, 8)}`;
}

export function ChatDrawerContent({ navigation }) {
  const v2 = useV2Theme();
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [sessionNames, setSessionNames] = useState({});
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const renameSheet = useRef(null);
  const toastRef = useRef(null);
  const openSwipeableRef = useRef(null);

  const loadSessionNames = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SESSION_NAMES_KEY);
      if (!raw) {
        setSessionNames({});
        return {};
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        setSessionNames(parsed);
        return parsed;
      }
    } catch {
      // Corrupt — reset.
    }
    setSessionNames({});
    return {};
  }, []);

  const persistSessionNames = useCallback(async (next) => {
    setSessionNames(next);
    try {
      await AsyncStorage.setItem(SESSION_NAMES_KEY, JSON.stringify(next));
    } catch {
      // Persist failure is non-fatal.
    }
  }, []);

  const loadSessions = useCallback(async () => {
    const [sessionsResult] = await Promise.all([chatApi.getSessions(), loadSessionNames()]);
    if (sessionsResult.error) {
      toastRef.current?.show({
        kind: 'error',
        title: 'Couldn\u2019t load chats',
        body: sessionsResult.error,
      });
      setSessions([]);
      return;
    }
    const sorted = [...(sessionsResult.data || [])].sort(
      (a, b) =>
        new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
    );
    setSessions(sorted);
  }, [loadSessionNames]);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const off1 = navigation.addListener('drawerOpen', loadSessions);
    const off2 = DeviceEventEmitter.addListener('chat:session-created', loadSessions);
    return () => {
      off1();
      off2.remove();
    };
  }, [loadSessions, navigation]);

  const getTitle = useCallback(
    (s) => sessionNames[s.sessionId] || s.sessionName || defaultTitle(s.sessionId),
    [sessionNames]
  );

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      if (bookmarksOnly && !s.isBookmarked) return false;
      if (!q) return true;
      return getTitle(s).toLowerCase().includes(q);
    });
  }, [getTitle, search, sessions, bookmarksOnly]);

  const startNewChat = useCallback(() => {
    navigation.navigate(CHAT_ROUTE, { sessionId: null, forceNewAt: Date.now() });
    navigation.closeDrawer();
  }, [navigation]);

  const openSession = useCallback(
    (s) => {
      navigation.navigate(CHAT_ROUTE, {
        sessionId: s.sessionId,
        sessionName: getTitle(s),
      });
      navigation.closeDrawer();
    },
    [getTitle, navigation]
  );

  const toggleBookmark = useCallback(async (s) => {
    const next = !s.isBookmarked;
    setSessions((prev) =>
      prev.map((it) => (it.sessionId === s.sessionId ? { ...it, isBookmarked: next } : it))
    );
    const result = await chatApi.setSessionBookmark(s.sessionId, next);
    if (result.error) {
      setSessions((prev) =>
        prev.map((it) =>
          it.sessionId === s.sessionId ? { ...it, isBookmarked: s.isBookmarked } : it
        )
      );
      toastRef.current?.show({
        kind: 'error',
        title: 'Couldn\u2019t update bookmark',
        body: result.error,
      });
    }
  }, []);

  const confirmDelete = useCallback(
    (s, swipeRef) => {
      Alert.alert('Delete conversation?', 'This cannot be undone.', [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => swipeRef?.close?.(),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSessions((prev) => prev.filter((it) => it.sessionId !== s.sessionId));
            const result = await chatApi.deleteSession(s.sessionId);
            if (result.error) {
              toastRef.current?.show({
                kind: 'error',
                title: 'Delete failed',
                body: result.error,
              });
              loadSessions();
              return;
            }
            const next = { ...sessionNames };
            delete next[s.sessionId];
            persistSessionNames(next);
          },
        },
      ]);
    },
    [loadSessions, persistSessionNames, sessionNames]
  );

  const openRename = useCallback(
    (s) => {
      setRenameId(s.sessionId);
      setRenameValue(getTitle(s));
      renameSheet.current?.present();
    },
    [getTitle]
  );

  const saveRename = useCallback(async () => {
    if (!renameId) return;
    const trimmed = renameValue.trim();
    const next = { ...sessionNames };
    if (!trimmed) delete next[renameId];
    else next[renameId] = trimmed;
    await persistSessionNames(next);
    setRenameId(null);
    setRenameValue('');
    renameSheet.current?.dismiss();
  }, [persistSessionNames, renameId, renameValue, sessionNames]);

  const handleSwipeOpen = useCallback((ref) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== ref) {
      openSwipeableRef.current.close?.();
    }
    openSwipeableRef.current = ref;
  }, []);

  return (
    <ScreenScaffold
      ambient
      ambientIntensity="subtle"
      paddingHorizontal={4}
      paddingBottom={0}
      scrollable={false}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: v2.spacing[3],
          paddingTop: v2.spacing[2],
        }}
      >
        <Text variant="display-lg">Chats</Text>
        <IconButton
          icon={BookmarksSimple}
          accessibilityLabel={
            bookmarksOnly ? 'Show all chats' : 'Show bookmarked chats only'
          }
          variant={bookmarksOnly ? 'accent' : 'solid'}
          weight={bookmarksOnly ? 'fill' : 'duotone'}
          onPress={() => setBookmarksOnly((b) => !b)}
        />
      </View>

      <View style={{ flex: 1 }}>
        {displayed.length === 0 ? (
          <EmptyState
            title={bookmarksOnly ? 'No bookmarks yet' : 'No conversations yet'}
            body={
              bookmarksOnly
                ? 'Tap the bookmark icon on any chat to save it here.'
                : 'Start a new chat to see your sessions appear here.'
            }
            action={{ label: 'Start a chat', onPress: startNewChat }}
          />
        ) : (
          <FlashList
            data={displayed}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(item) => item.sessionId}
            renderItem={({ item }) => (
              <SessionItem
                item={item}
                title={getTitle(item)}
                isOpenSwipeable={openSwipeableRef.current}
                onOpen={openSession}
                onRename={openRename}
                onToggleBookmark={toggleBookmark}
                onDelete={confirmDelete}
                onSwipeOpen={handleSwipeOpen}
              />
            )}
            contentContainerStyle={{ paddingBottom: 12 }}
          />
        )}
      </View>

      {/* Search + new chat dock — bleeds to drawer edges by cancelling the
          ScreenScaffold paddingHorizontal, then re-inserts its own padding.
          Closed state: paddingBottom = max(insets.bottom, spacing[3]) so
          the input row sits above the home indicator.
          Open state: opened = insets.bottom shifts the whole dock DOWN by
          that amount. KeyboardStickyView translates up by keyboardHeight
          (which includes safe-area on iOS), so the dock's bottom ends up
          at keyboardTop + insets.bottom. The dock's own insets.bottom of
          bottom-padding now sits behind the keyboard (invisible), leaving
          the input row flush against the keyboard top. */}
      <KeyboardStickyView
        offset={{ closed: 0, opened: insets.bottom }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: v2.spacing[2],
          paddingTop: v2.spacing[3],
          paddingBottom: Math.max(insets.bottom, v2.spacing[3]),
          paddingHorizontal: v2.spacing[4],
          marginHorizontal: -v2.spacing[4],
          borderTopWidth: 1,
          borderTopColor: v2.palette.border.subtle,
          backgroundColor: v2.palette.bg.base,
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: v2.palette.bg.surface,
            borderColor: v2.palette.border.subtle,
            borderWidth: 1,
            borderRadius: v2.radius.full,
            paddingHorizontal: 12,
            gap: 8,
            height: 44,
          }}
        >
          <MagnifyingGlass size={16} color={v2.palette.text.tertiary} weight="duotone" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search chats"
            placeholderTextColor={v2.palette.text.tertiary}
            keyboardAppearance={v2.isDark ? 'dark' : 'light'}
            style={{
              flex: 1,
              fontFamily: 'DMSans_400Regular',
              fontSize: 14,
              color: v2.palette.text.primary,
              padding: 0,
            }}
          />
        </View>
        <IconButton
          icon={Plus}
          accessibilityLabel="New chat"
          variant="accent"
          onPress={startNewChat}
        />
      </KeyboardStickyView>

      {/* Rename sheet */}
      <Sheet ref={renameSheet} snapPoints={['40%']}>
        <View style={{ paddingTop: v2.spacing[2], gap: v2.spacing[3] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
            <PencilSimple size={20} color={v2.palette.primary} weight="duotone" />
            <Text variant="h2">Rename conversation</Text>
          </View>
          <Input
            label="Conversation name"
            value={renameValue}
            onChangeText={setRenameValue}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={saveRename}
          />
          <View style={{ flexDirection: 'row', gap: v2.spacing[2], justifyContent: 'flex-end' }}>
            <Button variant="ghost" onPress={() => renameSheet.current?.dismiss()}>
              Cancel
            </Button>
            <Button variant="primary" onPress={saveRename}>
              Save
            </Button>
          </View>
        </View>
      </Sheet>

      <Toast ref={toastRef} />
    </ScreenScaffold>
  );
}

export default ChatDrawerContent;
