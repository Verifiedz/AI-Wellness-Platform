import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";
import { API_BASE_URL, DEV_MODE } from "../config";

/**
 * Settings screen – links to sub-settings and account actions.
 */
export function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();

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
      color: Colors.primary,
    },
    {
      icon: "person-outline",
      label: "Profile",
      onPress: () =>
        Alert.alert("Coming Soon", "Profile settings coming soon."),
      color: Colors.secondary,
    },
    {
      icon: "shield-outline",
      label: "Privacy",
      onPress: () =>
        Alert.alert("Coming Soon", "Privacy settings coming soon."),
      color: Colors.accent,
    },
    {
      icon: "help-circle-outline",
      label: "Help & Support",
      onPress: () =>
        Alert.alert("Coming Soon", "Help & Support coming soon."),
      color: Colors.textSecondary,
    },
  ];

  return (
    <View style={styles.container}>
      {/* User card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={32} color={Colors.primary} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.email || "User"}</Text>
          <Text style={styles.userId}>ID: {user?.id}</Text>
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
              color={Colors.textLight}
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
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...cardShadow,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${Colors.primaryLight}30`,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: { marginLeft: 16, flex: 1 },
  userName: { fontSize: 18, fontWeight: "600", color: Colors.text },
  userId: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  section: {
    backgroundColor: Colors.surface,
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
    borderBottomColor: Colors.border,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },

  devInfo: { alignItems: "center", marginBottom: 16 },
  devInfoText: { fontSize: 11, color: Colors.textLight },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    ...cardShadow,
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: Colors.error },
});
