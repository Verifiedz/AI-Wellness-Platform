import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const DATA_ITEMS = [
  {
    icon: "journal-outline",
    title: "Journal Entries",
    desc: "Your mood logs, emotions, energy levels, and journal text.",
  },
  {
    icon: "chatbubbles-outline",
    title: "Chat Conversations",
    desc: "Messages exchanged with the AI wellness assistant.",
  },
  {
    icon: "notifications-outline",
    title: "Notification Preferences",
    desc: "Your preferred delivery time and opt-in status.",
  },
  {
    icon: "person-outline",
    title: "Account Information",
    desc: "Username, email address, and hashed password.",
  },
];

export function PrivacySettingsScreen() {
  const { logout } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [expanded, setExpanded] = useState(null);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone. All your data including journal entries, chat history, and preferences will be deleted.\n\nTo proceed, please contact support.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Contact Support",
          onPress: () =>
            Linking.openURL("mailto:support@aiwellness.app?subject=Account%20Deletion%20Request"),
        },
      ]
    );
  };

  const toggleSection = (idx) => {
    setExpanded(expanded === idx ? null : idx);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Data Handling Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="server-outline" size={22} color={colors.primary} />
          <Text style={styles.cardTitle}>Your Data</Text>
        </View>
        <Text style={styles.cardDesc}>
          Here is what we store and how your data is used.
        </Text>

        {DATA_ITEMS.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.dataRow}
            onPress={() => toggleSection(idx)}
            activeOpacity={0.7}
          >
            <View style={styles.dataRowHeader}>
              <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.dataTitle}>{item.title}</Text>
              <Ionicons
                name={expanded === idx ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textSecondary}
              />
            </View>
            {expanded === idx && (
              <Text style={styles.dataDesc}>{item.desc}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Privacy Policy Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="document-text-outline" size={22} color={colors.primary} />
          <Text style={styles.cardTitle}>Privacy Policy</Text>
        </View>
        <Text style={styles.policyText}>
          Your privacy is important to us. We do not sell or share your personal
          data with third parties. All data is encrypted in transit and at rest.
          Journal entries and chat conversations are only accessible to you.
        </Text>
        <Text style={styles.policyText}>
          AI chat conversations are processed to provide wellness support and are
          not used to train machine learning models. You can delete your data at
          any time by contacting support.
        </Text>
      </View>

      {/* Delete Account Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="warning-outline" size={22} color={colors.error} />
          <Text style={[styles.cardTitle, { color: colors.error }]}>
            Danger Zone
          </Text>
        </View>
        <Text style={styles.cardDesc}>
          Permanently delete your account and all associated data.
        </Text>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteAccount}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={styles.deleteBtnText}>Request Account Deletion</Text>
        </TouchableOpacity>
      </View>
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

    dataRow: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 12,
    },
    dataRowHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    dataTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    dataDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 8,
      marginLeft: 46,
      lineHeight: 19,
    },

    policyText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 21,
      marginBottom: 12,
    },

    deleteBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: colors.error,
      borderRadius: 12,
      paddingVertical: 14,
      gap: 8,
    },
    deleteBtnText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.error,
    },
  });
