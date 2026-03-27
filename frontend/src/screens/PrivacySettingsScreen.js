import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Card } from "../components/Card";
import { Button } from "../components/Button";

const DATA_ITEMS = [
  { icon: "journal-outline", title: "Journal Entries", desc: "Your mood logs, emotions, energy levels, and journal text." },
  { icon: "chatbubbles-outline", title: "Chat Conversations", desc: "Messages exchanged with the AI wellness assistant." },
  { icon: "notifications-outline", title: "Notification Preferences", desc: "Your preferred delivery time and opt-in status." },
  { icon: "person-outline", title: "Account Information", desc: "Username, email address, and hashed password." },
];

export function PrivacySettingsScreen() {
  const { colors, fonts } = useTheme();
  const [expanded, setExpanded] = useState(null);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone. All your data will be deleted.\n\nTo proceed, please contact support.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Contact Support", onPress: () => Linking.openURL("mailto:support@sakina.app?subject=Account%20Deletion%20Request") },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Card style={{ marginBottom: 16 }}>
        <View style={styles.cardHeader}>
          <Ionicons name="server-outline" size={22} color={colors.primary} />
          <Text style={[fonts.heading3, { color: colors.text }]}>Your Data</Text>
        </View>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 12 }]}>
          Here is what we store and how your data is used.
        </Text>

        {DATA_ITEMS.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.dataRow, { borderBottomColor: colors.border }]}
            onPress={() => setExpanded(expanded === idx ? null : idx)}
            activeOpacity={0.7}
          >
            <View style={styles.dataRowHeader}>
              <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <Text style={[fonts.body, { color: colors.text, fontWeight: "600", flex: 1 }]}>{item.title}</Text>
              <Ionicons name={expanded === idx ? "chevron-up" : "chevron-down"} size={18} color={colors.textSecondary} />
            </View>
            {expanded === idx && (
              <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginTop: 8, marginLeft: 46, lineHeight: 19 }]}>{item.desc}</Text>
            )}
          </TouchableOpacity>
        ))}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <View style={styles.cardHeader}>
          <Ionicons name="document-text-outline" size={22} color={colors.primary} />
          <Text style={[fonts.heading3, { color: colors.text }]}>Privacy Policy</Text>
        </View>
        <Text style={[fonts.body, { color: colors.text, lineHeight: 22, marginBottom: 12 }]}>
          Your privacy is important to us. We do not sell or share your personal data with third parties. All data is encrypted in transit and at rest.
        </Text>
        <Text style={[fonts.body, { color: colors.text, lineHeight: 22 }]}>
          AI chat conversations are processed to provide wellness support and are not used to train machine learning models. You can delete your data at any time.
        </Text>
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Ionicons name="warning-outline" size={22} color={colors.error} />
          <Text style={[fonts.heading3, { color: colors.error }]}>Danger Zone</Text>
        </View>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 14 }]}>
          Permanently delete your account and all associated data.
        </Text>
        <Button
          variant="danger"
          title="Request Account Deletion"
          onPress={handleDeleteAccount}
          icon={<Ionicons name="trash-outline" size={18} color={colors.error} />}
        />
      </Card>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  dataRow: { paddingVertical: 12, borderBottomWidth: 1 },
  dataRowHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
});
