import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Modal,
  Alert,
  Keyboard,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { BreathingExerciseScreen } from '../screens/BreathingExerciseScreen';
import { useTheme } from '../context/ThemeContext';
import { AIChatScreen } from '../screens/AIChatScreen';
import { chatApi } from '../services/chatApi';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { CrisisButton } from '../components/CrisisButton';

const Drawer = createDrawerNavigator();
const ChatNativeStack = createNativeStackNavigator();
const SESSION_NAMES_KEY = 'chat_session_names_v1';
const CHAT_ROUTE = 'AIChatConversation';

function formatDefaultTitle(sessionId) {
  return `Session ${sessionId.slice(0, 8)}`;
}

function RightDeleteAction({ drag, colors, onPress }) {
  const animatedStyle = useAnimatedStyle(() => {
    const dragVal = typeof drag.value === 'number' ? drag.value : 0;
    const scale = Math.min(1, Math.max(0.5, -dragVal / 80));
    return { transform: [{ scale }] };
  });

  return (
    <TouchableOpacity
      style={[styles.swipeDelete, { backgroundColor: colors.error }]}
      onPress={onPress}
    >
      <Reanimated.View style={[{ alignItems: 'center' }, animatedStyle]}>
        <Ionicons name="trash" size={22} color="#fff" />
        <Text style={styles.swipeDeleteText}>Delete</Text>
      </Reanimated.View>
    </TouchableOpacity>
  );
}

function ChatDrawerContent({ navigation }) {
  const { colors, fonts } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [sessionNames, setSessionNames] = useState({});
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameSessionId, setRenameSessionId] = useState(null);
  const openSwipeableRef = useRef(null);

  const loadSessionNames = useCallback(async () => {
    const raw = await AsyncStorage.getItem(SESSION_NAMES_KEY);
    if (!raw) {
      setSessionNames({});
      return {};
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        setSessionNames(parsed);
        return parsed;
      }
    } catch {
      /* corrupted */
    }
    setSessionNames({});
    return {};
  }, []);

  const persistSessionNames = useCallback(async (nextNames) => {
    setSessionNames(nextNames);
    await AsyncStorage.setItem(SESSION_NAMES_KEY, JSON.stringify(nextNames));
  }, []);

  const loadSessions = useCallback(async () => {
    setError('');
    const [sessionsResult] = await Promise.all([chatApi.getSessions(), loadSessionNames()]);
    if (sessionsResult.error) {
      setError(sessionsResult.error || 'Failed to load chat sessions.');
      setSessions([]);
      return;
    }
    const sorted = [...(sessionsResult.data || [])].sort((a, b) => {
      return new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime();
    });
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
    const unsubscribeDrawer = navigation.addListener('drawerOpen', () => {
      loadSessions();
    });
    const sessionCreatedSub = DeviceEventEmitter.addListener('chat:session-created', () => {
      loadSessions();
    });
    return () => {
      unsubscribeDrawer();
      sessionCreatedSub.remove();
    };
  }, [loadSessions, navigation]);

  const getSessionTitle = useCallback(
    (session) =>
      sessionNames[session.sessionId] ||
      session.sessionName ||
      formatDefaultTitle(session.sessionId),
    [sessionNames]
  );

  const displayedSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sessions.filter((session) => {
      if (showBookmarkedOnly && !session.isBookmarked) return false;
      if (!q) return true;
      return getSessionTitle(session).toLowerCase().includes(q);
    });
  }, [getSessionTitle, searchQuery, sessions, showBookmarkedOnly]);

  const startNewChat = useCallback(() => {
    navigation.navigate(CHAT_ROUTE, { sessionId: null, forceNewAt: Date.now() });
    navigation.closeDrawer();
  }, [navigation]);

  const openSession = useCallback(
    (session) => {
      navigation.navigate(CHAT_ROUTE, {
        sessionId: session.sessionId,
        sessionName: getSessionTitle(session),
      });
      navigation.closeDrawer();
    },
    [getSessionTitle, navigation]
  );

  const toggleSessionBookmark = useCallback(async (session) => {
    const nextValue = !session.isBookmarked;
    setSessions((prev) =>
      prev.map((item) =>
        item.sessionId === session.sessionId ? { ...item, isBookmarked: nextValue } : item
      )
    );
    const result = await chatApi.setSessionBookmark(session.sessionId, nextValue);
    if (result.error) {
      setSessions((prev) =>
        prev.map((item) =>
          item.sessionId === session.sessionId
            ? { ...item, isBookmarked: session.isBookmarked }
            : item
        )
      );
      setError(result.error || 'Failed to update bookmark.');
    }
  }, []);

  const confirmDeleteSession = useCallback(
    (session) => {
      Alert.alert('Delete Chat', 'Are you sure? This cannot be undone.', [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            if (openSwipeableRef.current) {
              openSwipeableRef.current.close();
              openSwipeableRef.current = null;
            }
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSessions((prev) => prev.filter((s) => s.sessionId !== session.sessionId));
            const result = await chatApi.deleteSession(session.sessionId);
            if (result.error) {
              setError(result.error);
              loadSessions();
            } else {
              const nextNames = { ...sessionNames };
              delete nextNames[session.sessionId];
              persistSessionNames(nextNames);
            }
          },
        },
      ]);
    },
    [loadSessions, persistSessionNames, sessionNames]
  );

  const openRenameModal = useCallback(
    (session) => {
      setRenameSessionId(session.sessionId);
      setRenameValue(getSessionTitle(session));
      setRenameModalVisible(true);
    },
    [getSessionTitle]
  );

  const saveSessionName = useCallback(async () => {
    if (!renameSessionId) return;
    const trimmed = renameValue.trim();
    const nextNames = { ...sessionNames };
    if (!trimmed) delete nextNames[renameSessionId];
    else nextNames[renameSessionId] = trimmed;
    await persistSessionNames(nextNames);
    setRenameModalVisible(false);
    setRenameSessionId(null);
    setRenameValue('');
  }, [persistSessionNames, renameSessionId, renameValue, sessionNames]);

  const renderRightActions = useCallback(
    (item) => (_progress, drag) => {
      return (
        <RightDeleteAction drag={drag} colors={colors} onPress={() => confirmDeleteSession(item)} />
      );
    },
    [confirmDeleteSession, colors]
  );

  const closeOpenSwipeable = useCallback(() => {
    if (openSwipeableRef.current) {
      openSwipeableRef.current.close();
      openSwipeableRef.current = null;
    }
  }, []);

  const handleSwipeOpen = useCallback((ref) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== ref) {
      openSwipeableRef.current.close();
    }
    openSwipeableRef.current = ref;
  }, []);

  const renderSession = ({ item }) => {
    let swipeRef = null;
    const title = getSessionTitle(item);
    return (
      <ReanimatedSwipeable
        ref={(ref) => {
          swipeRef = ref;
        }}
        renderRightActions={renderRightActions(item)}
        overshootRight={false}
        friction={2}
        rightThreshold={30}
        dragOffsetFromRightEdge={1}
        onSwipeableOpen={() => handleSwipeOpen(swipeRef)}
      >
        <TouchableOpacity
          style={[
            styles.sessionRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => {
            closeOpenSwipeable();
            openSession(item);
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={[fonts.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
              {title}
            </Text>
            <Text
              style={[fonts.caption, { color: colors.textSecondary, marginTop: 4 }]}
              numberOfLines={1}
            >
              {new Date(item.createdDate).toLocaleString()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => openRenameModal(item)} hitSlop={8}>
              <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleSessionBookmark(item)} hitSlop={8}>
              <Ionicons
                name={item.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={item.isBookmarked ? colors.warning : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </ReanimatedSwipeable>
    );
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={[styles.drawerRoot, { backgroundColor: colors.background }]}>
          <DrawerContentScrollView
            showsVerticalScrollIndicator
            contentContainerStyle={[styles.drawerContent, { backgroundColor: colors.background }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.drawerInner}>
              <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
                <Text style={[fonts.heading1, { color: colors.text }]}>Chats</Text>
                <TouchableOpacity
                  onPress={() => setShowBookmarkedOnly((prev) => !prev)}
                  style={[
                    styles.filterBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name={showBookmarkedOnly ? 'bookmarks' : 'bookmarks-outline'}
                    size={18}
                    color={showBookmarkedOnly ? colors.warning : colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {displayedSessions.length === 0 ? (
                <Text
                  style={[
                    fonts.body,
                    {
                      color: colors.textSecondary,
                      marginTop: 12,
                      textAlign: 'center',
                      fontStyle: 'italic',
                    },
                  ]}
                >
                  No chat sessions found.
                </Text>
              ) : (
                <FlatList
                  data={displayedSessions}
                  keyExtractor={(item) => item.sessionId}
                  renderItem={renderSession}
                  scrollEnabled={false}
                />
              )}

              {error ? (
                <Text style={[fonts.caption, { color: colors.error, marginTop: 8 }]}>{error}</Text>
              ) : null}
            </View>
          </DrawerContentScrollView>

          <View
            style={[
              styles.searchDock,
              { borderTopColor: colors.border, backgroundColor: colors.background },
            ]}
          >
            <View
              style={[
                styles.searchWrap,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                style={[fonts.body, styles.searchInput, { color: colors.text }]}
                placeholder="Search chats"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.textLight}
              />
            </View>
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: colors.primary }]}
              onPress={startNewChat}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <Modal visible={renameModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <Card style={{ width: '100%', maxWidth: 340 }}>
            <Text style={[fonts.heading3, { color: colors.text, marginBottom: 14 }]}>
              Rename session
            </Text>
            <Input
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Enter session name"
            />
            <View style={styles.modalActions}>
              <Button
                variant="ghost"
                title="Cancel"
                onPress={() => {
                  setRenameModalVisible(false);
                  setRenameSessionId(null);
                  setRenameValue('');
                }}
              />
              <Button title="Save" onPress={saveSessionName} />
            </View>
          </Card>
        </View>
      </Modal>
    </>
  );
}

function ChatDrawerNav() {
  const { colors, fonts } = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { ...fonts.heading3, color: colors.text },
        headerRight: () => <CrisisButton />,
        drawerType: 'slide',
        swipeEdgeWidth: 40,
        swipeMinDistance: 50,
      }}
      drawerContent={(props) => <ChatDrawerContent {...props} />}
    >
      <Drawer.Screen name={CHAT_ROUTE} component={AIChatScreen} options={{ title: 'Sakina' }} />
    </Drawer.Navigator>
  );
}

export function ChatStack() {
  const { colors, fonts } = useTheme();

  return (
    <ChatNativeStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatNativeStack.Screen name="ChatDrawer" component={ChatDrawerNav} />
      <ChatNativeStack.Screen
        name="BreathingExercise"
        component={BreathingExerciseScreen}
        options={{
          headerShown: true,
          title: 'Breathe',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 350,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { ...fonts.heading3, color: colors.text },
          headerShadowVisible: false,
        }}
      />
    </ChatNativeStack.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerRoot: { flex: 1 },
  drawerContent: { flexGrow: 1, paddingVertical: 16 },
  drawerInner: { paddingHorizontal: 16, paddingRight: 30 },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: { flex: 1, height: 42 },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  sessionRow: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swipeDelete: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  swipeDeleteText: { color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 2 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
});
