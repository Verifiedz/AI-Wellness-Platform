import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { format, subDays } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { useTip } from "../context/TipContext";
import { useTheme } from "../context/ThemeContext";
import { journalApi } from "../services/journalApi";
import { chatApi } from "../services/chatApi";

function normalizeMood(value) {
  const mood = String(value || "").toLowerCase();
  if (!mood) return null;
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

function getDisplayName(user) {
  if (user?.username?.trim()) return user.username.trim();
  if (user?.email?.includes("@")) return user.email.split("@")[0];
  return "there";
}

function computeCurrentStreak(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return 0;

  const entryDays = new Set(
    entries
      .map((entry) => String(entry.entryDate || "").slice(0, 10))
      .filter(Boolean)
  );

  let streak = 0;
  let cursor = new Date();

  while (true) {
    const day = format(cursor, "yyyy-MM-dd");
    if (!entryDays.has(day)) break;
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return streak;
}

function buildDateRange(days) {
  const endDate = new Date();
  const startDate = subDays(endDate, Math.max(days - 1, 0));
  return {
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
  };
}

export function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { currentTip, clearTip } = useTip();
  const { colors } = useTheme();
  const Colors = colors;
  const styles = createStyles(Colors);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [todayEntry, setTodayEntry] = useState(null);
  const [weekSummary, setWeekSummary] = useState(null);
  const [streakEntries, setStreakEntries] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [quickPrompt, setQuickPrompt] = useState(null);

  const loadDashboard = useCallback(async (isSoftRefresh = false) => {
    if (isSoftRefresh) setIsRefreshing(true);
    else setIsInitialLoading(true);

    setDashboardError("");

    const today = format(new Date(), "yyyy-MM-dd");
    const weekRange = buildDateRange(7);
    const monthRange = buildDateRange(30);

    try {
      const [
        todayEntryResult,
        summaryResult,
        recentEntriesResult,
        sessionsResult,
        promptResult,
      ] = await Promise.all([
        journalApi.getEntryByDate(today),
        journalApi.getMoodSummary(weekRange),
        journalApi.getEntries({ ...monthRange, limit: 30 }),
        chatApi.getSessions(),
        journalApi.getRandomPrompt(),
      ]);

      setTodayEntry(todayEntryResult.error ? null : todayEntryResult.data || null);
      setWeekSummary(summaryResult.error ? null : summaryResult.data || null);

      const entries = Array.isArray(recentEntriesResult.data)
        ? [...recentEntriesResult.data]
            .sort(
              (a, b) =>
                new Date(b.entryDate || 0).getTime() -
                new Date(a.entryDate || 0).getTime()
            )
        : [];
      setStreakEntries(entries);

      setChatSessions(Array.isArray(sessionsResult.data) ? sessionsResult.data : []);
      setQuickPrompt(promptResult.error ? null : promptResult.data || null);
    } catch {
      setDashboardError("Unable to load your dashboard right now.");
    } finally {
      if (isSoftRefresh) setIsRefreshing(false);
      else setIsInitialLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard(false);
    }, [loadDashboard])
  );

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const currentStreak = useMemo(
    () => computeCurrentStreak(streakEntries),
    [streakEntries]
  );
  const bookmarkedSessions = useMemo(
    () => chatSessions.filter((session) => session.isBookmarked).length,
    [chatSessions]
  );
  const averageEnergy = useMemo(() => {
    const value = weekSummary?.averageEnergy;
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "-";
    }
    return Number(value).toFixed(1);
  }, [weekSummary]);

  const goToJournal = useCallback(() => {
    navigation.navigate("Journal");
  }, [navigation]);

  const goToMoodCalendar = useCallback(() => {
    navigation.navigate("Journal", { screen: "MoodCalendar" });
  }, [navigation]);

  const goToAIChat = useCallback(() => {
    navigation.navigate("AI Chat", {
      screen: "AIChatConversation",
      params: { sessionId: null, forceNewAt: Date.now() },
    });
  }, [navigation]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadDashboard(true)}
        />
      }
    >
      <View style={styles.greetingCard}>
        <Text style={styles.greeting}>Welcome back, {displayName}!</Text>
        <Text style={styles.greetingSubtext}>How are you feeling today?</Text>
      </View>

      {dashboardError ? <Text style={styles.dashboardError}>{dashboardError}</Text> : null}

      {isInitialLoading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>At a Glance</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Ionicons name="today-outline" size={20} color={Colors.primary} />
            <Text style={styles.metricValue}>{todayEntry ? "Done" : "Pending"}</Text>
            <Text style={styles.metricLabel}>Today's Journal</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="flame-outline" size={20} color={Colors.warning} />
            <Text style={styles.metricValue}>{currentStreak}</Text>
            <Text style={styles.metricLabel}>Day Streak</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons
              name="chatbox-ellipses-outline"
              size={20}
              color={Colors.accent}
            />
            <Text style={styles.metricValue}>{chatSessions.length}</Text>
            <Text style={styles.metricLabel}>Chat Sessions</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tip of the Day</Text>

        {currentTip ? (
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Ionicons name="bulb" size={24} color={Colors.warning} />
              <Text style={styles.tipTitle}>{currentTip.title}</Text>
            </View>

            <Text style={styles.tipBody}>{currentTip.body}</Text>

            {currentTip.category && (
              <View style={styles.tipCategoryBadge}>
                <Text style={styles.tipCategoryText}>{currentTip.category}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.dismissButton} onPress={clearTip}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noTipCard}>
            <Ionicons
              name="bulb-outline"
              size={40}
              color={Colors.textLight}
            />
            <Text style={styles.noTipText}>No tip yet today</Text>
            <Text style={styles.noTipSubtext}>
              Enable daily tips in Settings to receive wellness tips!
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={goToJournal}>
            <Ionicons
              name="journal-outline"
              size={28}
              color={Colors.secondary}
            />
            <Text style={styles.actionText}>Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={goToAIChat}>
            <Ionicons
              name="chatbubbles-outline"
              size={28}
              color={Colors.accent}
            />
            <Text style={styles.actionText}>AI Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={goToMoodCalendar}>
            <Ionicons
              name="stats-chart-outline"
              size={28}
              color={Colors.primary}
            />
            <Text style={styles.actionText}>Progress</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wellness Overview</Text>
        <View style={styles.overviewCard}>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Most Common Mood</Text>
            <Text style={styles.overviewValue}>
              {normalizeMood(weekSummary?.mostCommonMood) || "No data"}
            </Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Average Energy</Text>
            <Text style={styles.overviewValue}>{averageEnergy}</Text>
          </View>
          <View style={styles.overviewRow}>
            <Text style={styles.overviewLabel}>Bookmarked Chats</Text>
            <Text style={styles.overviewValue}>{bookmarkedSessions}</Text>
          </View>
          <TouchableOpacity style={styles.inlineLinkButton} onPress={goToMoodCalendar}>
            <Text style={styles.inlineLinkText}>Open Mood Calendar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reflection Prompt</Text>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewText}>
            {quickPrompt?.content ||
              "Take a breath and write one thing you are grateful for today."}
          </Text>
          <View style={styles.promptActionsRow}>
            <TouchableOpacity style={styles.inlineLinkButton} onPress={goToJournal}>
              <Text style={styles.inlineLinkText}>Use in Journal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.inlineLinkButton}
              onPress={() => loadDashboard(true)}
            >
              <Text style={styles.inlineLinkText}>New Prompt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

const createStyles = (Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { padding: 16, paddingBottom: 32 },

  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  dashboardError: {
    color: Colors.error,
    marginBottom: 12,
    fontSize: 13,
  },

  greetingCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: "#fff" },
  greetingSubtext: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },

  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 4,
    ...cardShadow,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  tipCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    ...cardShadow,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  tipTitle: { fontSize: 16, fontWeight: "600", color: Colors.text, flex: 1 },
  tipBody: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22 },
  tipCategoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: `${Colors.primaryLight}30`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  tipCategoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  dismissButton: { alignSelf: "flex-end", marginTop: 12 },
  dismissText: { fontSize: 14, color: Colors.textSecondary, fontWeight: "500" },

  noTipCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    ...cardShadow,
  },
  noTipText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: 12,
  },
  noTipSubtext: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 6,
    textAlign: "center",
  },

  actionsRow: { flexDirection: "row", gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    ...cardShadow,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 8,
  },

  overviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...cardShadow,
  },
  overviewText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  overviewLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  overviewValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
  },

  inlineLinkButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 4,
  },
  inlineLinkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  promptActionsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },
});
