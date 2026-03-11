import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  DeviceEventEmitter,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { createDrawerNavigator, DrawerContentScrollView } from "@react-navigation/drawer";
import { useFocusEffect } from "@react-navigation/native";
import { AIChatScreen } from "../screens/AIChatScreen";
import { chatApi } from "../services/chatApi";
import { Colors } from "../theme/colors";

const Drawer = createDrawerNavigator();
const SESSION_NAMES_KEY = "chat_session_names_v1";
const CHAT_ROUTE = "AIChatConversation";

function formatDefaultTitle(sessionId) {
  return `Session ${sessionId.slice(0, 8)}`;
}

function ChatDrawerContent({ navigation }) {
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

  const displayedSessions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return sessions.filter((session) => {
      if (showBookmarkedOnly && !session.isBookmarked) return false;
      const title = sessionNames[session.sessionId] || formatDefaultTitle(session.sessionId);
      if (!normalizedQuery) return true;
      return title.toLowerCase().includes(normalizedQuery);
    });
  }, [searchQuery, sessionNames, sessions, showBookmarkedOnly]);

  const startNewChat = useCallback(() => {
    navigation.navigate(CHAT_ROUTE, { sessionId: null, forceNewAt: Date.now() });
    navigation.closeDrawer();
  }, [navigation]);

  const openSession = useCallback(
    (sessionId) => {
      navigation.navigate(CHAT_ROUTE, { sessionId });
      navigation.closeDrawer();
    },
    [navigation]
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

  const openRenameModal = useCallback(
    (session) => {
      setRenameSessionId(session.sessionId);
      setRenameValue(sessionNames[session.sessionId] || formatDefaultTitle(session.sessionId));
      setRenameModalVisible(true);
    },
    [sessionNames]
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

  const renderSession = ({ item }) => {
    const title = sessionNames[item.sessionId] || formatDefaultTitle(item.sessionId);
    return (
      <TouchableOpacity style={styles.sessionRow} onPress={() => openSession(item.sessionId)}>
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

const styles = StyleSheet.create({
  drawerRoot: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  drawerContent: {
    flexGrow: 1,
    paddingVertical: 14,
    backgroundColor: Colors.background,
  },
  drawerInner: {
    paddingHorizontal: 14,
    paddingRight: 34,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },
  bookmarkFilterButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBarDock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
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
    borderRadius: 12,
    paddingHorizontal: 10,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: Colors.text,
  },
  newChatFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionRow: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 8,
    marginRight: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sessionMain: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  sessionMeta: {
    marginTop: 3,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sessionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
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
    maxWidth: 320,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 10,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  modalActions: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
  },
  cancelText: {
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  saveText: {
    color: Colors.primary,
    fontWeight: "700",
  },
});
