import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Animated,
  Platform,
  DeviceEventEmitter,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { createDrawerNavigator, DrawerContentScrollView } from "@react-navigation/drawer";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { AIChatScreen } from "../screens/AIChatScreen";
import { chatApi } from "../services/chatApi";

const Drawer = createDrawerNavigator();
const SESSION_NAMES_KEY = "chat_session_names_v1";
const CHAT_ROUTE = "AIChatConversation";

function formatDefaultTitle(sessionId) {
  return `Session ${sessionId.slice(0, 8)}`;
}

function ChatDrawerContent({ navigation }) {
  const { colors } = useTheme();
  const Colors = colors;
  const styles = createStyles(Colors);
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [sessionNames, setSessionNames] = useState({});
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameSessionId, setRenameSessionId] = useState(null);

  const loadSessionNames = useCallback(async () => {
    const raw = await AsyncStorage.getItem(SESSION_NAMES_KEY);
    if (!raw) {
      setSessionNames({});
      return {};
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setSessionNames(parsed);
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse saved session names", e);
    }

    setSessionNames({});
    return {};
  }, []);

  const persistSessionNames = useCallback(async (nextNames) => {
    setSessionNames(nextNames);
    await AsyncStorage.setItem(SESSION_NAMES_KEY, JSON.stringify(nextNames));
  }, []);

  const loadSessions = useCallback(async () => {
    setError("");
    const [sessionsResult] = await Promise.all([chatApi.getSessions(), loadSessionNames()]);
    if (sessionsResult.error) {
      setError(sessionsResult.error || "Failed to load chat sessions.");
      setSessions([]);
      return;
    }

    const sorted = [...(sessionsResult.data || [])].sort((a, b) => {
      const aTime = new Date(a.createdDate || 0).getTime();
      const bTime = new Date(b.createdDate || 0).getTime();
      return bTime - aTime;
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
    const unsubscribeDrawer = navigation.addListener("drawerOpen", () => {
      // Refresh every time the drawer opens.
      loadSessions();
    });

    const sessionCreatedSub = DeviceEventEmitter.addListener(
      "chat:session-created",
      () => {
        // Refresh immediately when AIChatScreen creates a brand-new session.
        loadSessions();
      }
    );

    return () => {
      unsubscribeDrawer();
      sessionCreatedSub.remove();
    };
  }, [loadSessions, navigation]);

  const getSessionTitle = useCallback(
    (session) =>
      sessionNames[session.sessionId] || session.sessionName || formatDefaultTitle(session.sessionId),
    [sessionNames]
  );

  const displayedSessions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return sessions.filter((session) => {
      if (showBookmarkedOnly && !session.isBookmarked) return false;
      const title = getSessionTitle(session);
      if (!normalizedQuery) return true;
      return title.toLowerCase().includes(normalizedQuery);
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
        item.sessionId === session.sessionId
          ? { ...item, isBookmarked: nextValue }
          : item
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
      setError(result.error || "Failed to update bookmark.");
    }
  }, []);

  const confirmDeleteSession = useCallback(
    (session) => {
      Alert.alert("Delete Chat", "Are you sure? This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setSessions((prev) => prev.filter((s) => s.sessionId !== session.sessionId));
            const result = await chatApi.deleteSession(session.sessionId);
            if (result.error) {
              setError(result.error || "Failed to delete session.");
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
    if (!trimmed) {
      delete nextNames[renameSessionId];
    } else {
      nextNames[renameSessionId] = trimmed;
    }

    await persistSessionNames(nextNames);
    setRenameModalVisible(false);
    setRenameSessionId(null);
    setRenameValue("");
  }, [persistSessionNames, renameSessionId, renameValue, sessionNames]);

  const renderRightActions = useCallback(
    (item) => (_progress, dragX) => {
      const scale = dragX.interpolate({
        inputRange: [-80, 0],
        outputRange: [1, 0.5],
        extrapolate: "clamp",
      });
      return (
        <TouchableOpacity
          style={styles.swipeDeleteAction}
          onPress={() => confirmDeleteSession(item)}
        >
          <Animated.View style={{ transform: [{ scale }], alignItems: "center" }}>
            <Ionicons name="trash" size={22} color="#fff" />
            <Text style={styles.swipeDeleteText}>Delete</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    },
    [confirmDeleteSession, styles]
  );

  const renderSession = ({ item }) => {
    const title = getSessionTitle(item);
    return (
      <Swipeable
        renderRightActions={renderRightActions(item)}
        overshootRight={false}
        friction={2}
      >
        <TouchableOpacity style={styles.sessionRow} onPress={() => openSession(item)}>
          <View style={styles.sessionMain}>
            <Text style={styles.sessionTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.sessionMeta} numberOfLines={1}>
              {new Date(item.createdDate).toLocaleString()}
            </Text>
          </View>
          <View style={styles.sessionActions}>
            <TouchableOpacity onPress={() => openRenameModal(item)} hitSlop={8}>
              <Ionicons name="pencil-outline" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleSessionBookmark(item)} hitSlop={8}>
              <Ionicons
                name={item.isBookmarked ? "bookmark" : "bookmark-outline"}
                size={18}
                color={item.isBookmarked ? Colors.warning : Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <>
      <View style={styles.drawerRoot}>
        <DrawerContentScrollView
          showsVerticalScrollIndicator
          scrollIndicatorInsets={{ right: 0 }}
          contentContainerStyle={styles.drawerContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.drawerInner}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Chats</Text>
              <TouchableOpacity
                onPress={() => setShowBookmarkedOnly((prev) => !prev)}
                style={styles.bookmarkFilterButton}
              >
                <Ionicons
                  name={showBookmarkedOnly ? "bookmarks" : "bookmarks-outline"}
                  size={18}
                  color={showBookmarkedOnly ? Colors.warning : Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {displayedSessions.length === 0 ? (
              <Text style={styles.emptyText}>No chat sessions found.</Text>
            ) : (
              <FlatList
                data={displayedSessions}
                keyExtractor={(item) => item.sessionId}
                renderItem={renderSession}
                scrollEnabled={false}
              />
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </DrawerContentScrollView>

        <View style={styles.searchBarDock}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search chats"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textLight}
            />
          </View>
          <TouchableOpacity style={styles.newChatFab} onPress={startNewChat}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={renameModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename session</Text>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              style={styles.renameInput}
              placeholder="Enter session name"
              placeholderTextColor={Colors.textLight}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setRenameModalVisible(false);
                  setRenameSessionId(null);
                  setRenameValue("");
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveSessionName}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function ChatStack() {
  const { colors } = useTheme();
  const Colors = colors;

  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
        drawerType: "slide",
        swipeEdgeWidth: 40,
      }}
      drawerContent={(props) => <ChatDrawerContent {...props} />}
    >
      <Drawer.Screen
        name={CHAT_ROUTE}
        component={AIChatScreen}
        options={{ title: "AI Chat" }}
      />
    </Drawer.Navigator>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  drawerRoot: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  drawerContent: {
    flexGrow: 1,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  drawerInner: {
    paddingHorizontal: 16,
    paddingRight: 30,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.3,
  },
  bookmarkFilterButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBarDock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    color: Colors.text,
    fontSize: 14,
  },
  newChatFab: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
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
  sessionRow: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  sessionMain: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 20,
  },
  sessionMeta: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sessionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 14,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.text,
    backgroundColor: Colors.background,
    fontSize: 15,
  },
  modalActions: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: 15,
    paddingVertical: 4,
  },
  saveText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 15,
    paddingVertical: 4,
  },
  swipeDeleteAction: {
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  swipeDeleteText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
});
