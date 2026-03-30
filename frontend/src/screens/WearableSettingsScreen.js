import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Banner } from "../components/Banner";
import { useWearableData } from "../hooks/useWearableData";
import { isWearableAvailable, requestPermissions } from "../services/wearableService";

/**
 * Wearable device settings screen (Coming Soon).
 * Health data / wearable integration is not yet available — requires a native Expo build
 * with native health modules installed. The screen is kept as a skeleton for future implementation.
 */
export function WearableSettingsScreen() {
  const { colors, fonts } = useTheme();
  const { isAvailable, isEnabled, setEnabled, data } = useWearableData();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleToggle = useCallback(async (enabled) => {
    if (enabled) {
      setIsConnecting(true);
      try {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert(
            "Permission Required",
            "Please grant health data access in your device settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
        await setEnabled(true);
      } catch {
        Alert.alert("Error", "Failed to connect to health data.");
      } finally {
        setIsConnecting(false);
      }
    } else {
      await setEnabled(false);
    }
  }, [setEnabled]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Banner
        type="warning"
        message="Coming Soon — Wearable integration requires a native Expo build with health modules installed. It is not available in Expo Go or on web."
        icon="warning-outline"
      />

      <Banner
        type="info"
        message="Health data stays on your device and is never sent to our servers. You can disconnect at any time."
        icon="shield-checkmark-outline"
      />

      <Card>
        <View style={styles.toggleRow}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="fitness-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[fonts.body, { color: colors.text }]}>Health Data</Text>
            <Text style={[fonts.caption, { color: colors.textSecondary }]}>
              {isEnabled ? "Connected" : "Not connected"}
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            disabled={!isAvailable || isConnecting}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={isEnabled ? colors.primary : "#f4f3f4"}
            ios_backgroundColor={colors.border}
          />
        </View>
      </Card>

      {isEnabled && (
        <Card style={{ marginTop: 12 }}>
          <Text style={[fonts.heading3, { color: colors.text, marginBottom: 12 }]}>
            Data Sources
          </Text>
          {[
            { icon: "footsteps-outline", label: "Steps", value: data.steps?.toLocaleString() || "No data" },
            { icon: "heart-outline", label: "Heart Rate", value: data.heartRate ? `${data.heartRate} bpm` : "No data" },
            { icon: "moon-outline", label: "Sleep", value: data.sleepHours ? `${data.sleepHours}h` : "No data" },
          ].map((item) => (
            <View key={item.label} style={styles.dataRow}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
              <Text style={[fonts.body, { color: colors.text, flex: 1 }]}>{item.label}</Text>
              <Text style={[fonts.bodySmall, { color: colors.textSecondary }]}>{item.value}</Text>
            </View>
          ))}
        </Card>
      )}

      {isEnabled && (
        <Button
          title="Disconnect"
          variant="danger"
          onPress={() => handleToggle(false)}
          style={{ marginTop: 24 }}
          icon={<Ionicons name="close-circle-outline" size={16} color={colors.error} />}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
});
