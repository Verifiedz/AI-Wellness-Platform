import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTip } from "../context/TipContext";
import { Colors } from "../theme/colors";

/**
 * Home screen – the main landing page.
 *
 * Features:
 *  - Greeting card
 *  - "Tip of the Day" section (populated from push notifications)
 *  - Quick-action cards (placeholders for Journal, AI Chat, Progress)
 *  - Wellness overview placeholder
 */
export function HomeScreen() {
  const { user } = useAuth();
  const { currentTip, clearTip } = useTip();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Greeting */}
      <View style={styles.greetingCard}>
        <Text style={styles.greeting}>
          Welcome back{user?.email ? `, ${user.email}` : ""}!
        </Text>
        <Text style={styles.greetingSubtext}>
          How are you feeling today?
        </Text>
      </View>

      {/* ---- Tip of the Day ---- */}
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
                <Text style={styles.tipCategoryText}>
                  {currentTip.category}
                </Text>
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

      {/* ---- Quick Actions ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <View style={styles.actionCard}>
            <Ionicons
              name="journal-outline"
              size={28}
              color={Colors.secondary}
            />
            <Text style={styles.actionText}>Journal</Text>
          </View>
          <View style={styles.actionCard}>
            <Ionicons
              name="chatbubbles-outline"
              size={28}
              color={Colors.accent}
            />
            <Text style={styles.actionText}>AI Chat</Text>
          </View>
          <View style={styles.actionCard}>
            <Ionicons
              name="stats-chart-outline"
              size={28}
              color={Colors.primary}
            />
            <Text style={styles.actionText}>Progress</Text>
          </View>
        </View>
      </View>

      {/* ---- Wellness Overview (placeholder) ---- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wellness Overview</Text>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewText}>
            Track your mood, habits, and wellness journey here. Full features
            coming soon!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

/* ---------- styles ---------- */

const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { padding: 16, paddingBottom: 32 },

  /* greeting */
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

  /* sections */
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },

  /* tip card */
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

  /* no tip */
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

  /* quick actions */
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

  /* overview */
  overviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    ...cardShadow,
  },
  overviewText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
});
