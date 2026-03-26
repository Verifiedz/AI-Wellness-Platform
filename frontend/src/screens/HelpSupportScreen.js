import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import Constants from "expo-constants";

const FAQ_ITEMS = [
  {
    question: "How do I create a journal entry?",
    answer:
      "Navigate to the Journal tab and select your mood, energy level, and emotions. Write your thoughts in the text area and tap 'Save Journal Entry'. You can edit or delete today's entry at any time.",
  },
  {
    question: "What does the AI chat do?",
    answer:
      "The AI wellness assistant provides supportive conversations about your mental health and well-being. It can offer coping strategies, mindfulness exercises, and a safe space to reflect on your feelings.",
  },
  {
    question: "How do I view past journal entries?",
    answer:
      "Tap the calendar icon on the Journal screen to open the Mood Calendar. You can view your entries by month, week, or year. Tap on any day with a mood dot to view that entry.",
  },
  {
    question: "Can I change my notification time?",
    answer:
      "Yes! Go to Settings > Notification Settings. Toggle daily tips on and use the time stepper to choose your preferred delivery time.",
  },
  {
    question: "Is my data private?",
    answer:
      "Absolutely. Your journal entries and chat conversations are encrypted and only accessible to you. We do not sell or share your data with third parties. Visit Settings > Privacy for more details.",
  },
  {
    question: "How do I change my password?",
    answer:
      "Go to Settings > Profile and use the Change Password form. You'll need your current password and a new password that's at least 8 characters long.",
  },
];

export function HelpSupportScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [expandedIdx, setExpandedIdx] = useState(null);

  const appVersion =
    Constants.expoConfig?.version || Constants.manifest?.version || "1.0.0";

  const toggleFaq = (idx) => {
    setExpandedIdx(expandedIdx === idx ? null : idx);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* FAQ Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="help-buoy-outline" size={22} color={colors.primary} />
          <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
        </View>

        {FAQ_ITEMS.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.faqRow,
              idx === FAQ_ITEMS.length - 1 && { borderBottomWidth: 0 },
            ]}
            onPress={() => toggleFaq(idx)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Ionicons
                name={expandedIdx === idx ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textSecondary}
              />
            </View>
            {expandedIdx === idx && (
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Contact Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="mail-outline" size={22} color={colors.primary} />
          <Text style={styles.cardTitle}>Contact Support</Text>
        </View>
        <Text style={styles.cardDesc}>
          Having trouble or have a question not covered above? Reach out to us.
        </Text>

        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() =>
            Linking.openURL("mailto:support@aiwellness.app?subject=Support%20Request")
          }
          activeOpacity={0.8}
        >
          <Ionicons name="send-outline" size={18} color="#fff" />
          <Text style={styles.contactBtnText}>Email Support</Text>
        </TouchableOpacity>
      </View>

      {/* App Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.cardTitle}>About</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>{appVersion}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Platform</Text>
          <Text style={styles.infoValue}>AI Wellness Platform</Text>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      ...cardShadow,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    cardDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 16,
    },

    faqRow: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    faqHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    faqQuestion: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      marginRight: 8,
    },
    faqAnswer: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 21,
      marginTop: 10,
    },

    contactBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      gap: 8,
    },
    contactBtnText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },

    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: { fontSize: 14, color: colors.textSecondary },
    infoValue: { fontSize: 14, fontWeight: "600", color: colors.text },
  });
