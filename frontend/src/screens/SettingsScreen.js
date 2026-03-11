import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL, DEV_MODE } from "../config";

/**
 * Settings screen – links to sub-settings and account actions.
 */
export function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { colors, isDarkMode, setDarkMode } = useTheme();
  const styles = createStyles(colors);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", onPress: logout, style: "destructive" },
    ]);
  };

  const items = [
    {
      icon: "notifications-outline",
      label: "Notification Settings",
      onPress: () => navigation.navigate("NotificationSettings"),
      color: colors.primary,
    },
    {
      icon: "person-outline",
      label: "Profile",
      onPress: () =>
        Alert.alert("Coming Soon", "Profile settings coming soon."),
      color: colors.secondary,
    },
    {
      icon: "shield-outline",
      label: "Privacy",
      onPress: () =>
        Alert.alert("Coming Soon", "Privacy settings coming soon."),
      color: colors.accent,
    },
    {
      icon: "help-circle-outline",
      label: "Help & Support",
      onPress: () =>
        Alert.alert("Coming Soon", "Help & Support coming soon."),
      color: colors.textSecondary,
    },
  ];

  return (
    <View style={styles.container}>
      {/* User card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={colors.primary} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.username || user?.email || "User"}</Text>
          <Text style={styles.userId}>ID: {user?.id}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${colors.warning}20` },
            ]}
          >
            <Ionicons
              name={isDarkMode ? "moon" : "moon-outline"}
              size={22}
              color={colors.warning}
            />
          </View>
          <View style={styles.themeTextWrap}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingSubLabel}>
              Use a darker color theme across the app
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={isDarkMode ? colors.primary : "#f4f3f4"}
            ios_backgroundColor={colors.border}
          />
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.section}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.settingItem,
              i === items.length - 1 && { borderBottomWidth: 0 },
            ]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${item.color}15` },
              ]}
            >
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Dev info */}
      {DEV_MODE && (
        <View style={styles.devInfo}>
          <Text style={styles.devInfoText}>Dev Mode Active</Text>
          <Text style={styles.devInfoText}>API: {API_BASE_URL}</Text>
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------- styles ---------- */

const cardShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};

const createStyles = (colors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...cardShadow,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primaryLight}30`,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: { marginLeft: 16, flex: 1 },
  userName: { fontSize: 18, fontWeight: "600", color: colors.text },
  userId: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    ...cardShadow,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  themeTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  settingSubLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  devInfo: { alignItems: "center", marginBottom: 16 },
  devInfoText: { fontSize: 11, color: colors.textLight },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    ...cardShadow,
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: colors.error },
});
