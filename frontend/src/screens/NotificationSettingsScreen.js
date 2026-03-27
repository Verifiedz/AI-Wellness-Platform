import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { notificationApi } from "../services/notificationApi";
import {
  getDeviceTimezone,
  localTimeToUtc,
  utcToLocalTime,
  formatTimeForDisplay,
} from "../utils/time";
import { useTheme } from "../context/ThemeContext";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Banner } from "../components/Banner";

export function NotificationSettingsScreen() {
  const { colors, fonts } = useTheme();
  const [isEnabled, setIsEnabled] = useState(false);
  const [preferredTime, setPreferredTime] = useState("09:00");
  const [timezone, setTimezone] = useState(getDeviceTimezone());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      timeOptions.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await notificationApi.getPreferences();
      if (result.status === 404) {
        setHasExisting(false);
        setIsEnabled(false);
        setPreferredTime("09:00");
        setTimezone(getDeviceTimezone());
      } else if (result.error) {
        Alert.alert("Error", result.error);
      } else if (result.data) {
        setHasExisting(true);
        setIsEnabled(result.data.isEnabled);
        const deviceTz = getDeviceTimezone();
        setTimezone(deviceTz);
        if (result.data.preferredTimeUtc) {
          setPreferredTime(utcToLocalTime(result.data.preferredTimeUtc, deviceTz));
        }
      }
    } catch {
      Alert.alert("Error", "Failed to load notification preferences.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadPreferences(); }, [loadPreferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const preferredTimeUtc = localTimeToUtc(preferredTime, timezone);
      const result = await notificationApi.savePreferences({ isEnabled, preferredTimeUtc, timezone });
      if (result.error) Alert.alert("Error", result.error);
      else { setHasExisting(true); Alert.alert("Success", "Preferences saved!"); }
    } catch {
      Alert.alert("Error", "Failed to save preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const cycleTime = (direction) => {
    const idx = timeOptions.indexOf(preferredTime);
    const cur = idx === -1 ? 18 : idx;
    const next = direction === "up"
      ? (cur + 1) % timeOptions.length
      : (cur - 1 + timeOptions.length) % timeOptions.length;
    setPreferredTime(timeOptions[next]);
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[fonts.body, { color: colors.textSecondary, marginTop: 12 }]}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {!hasExisting && (
        <Banner variant="info" message="No notification preferences set yet. Configure your daily tips below." />
      )}

      <Card style={{ marginBottom: 16 }}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Ionicons name="notifications" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[fonts.body, { color: colors.text, fontWeight: "600" }]}>Daily Wellness Tips</Text>
              <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                Receive a daily wellness tip at your preferred time
              </Text>
            </View>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={setIsEnabled}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={isEnabled ? colors.primary : "#f4f3f4"}
            ios_backgroundColor={colors.border}
          />
        </View>
      </Card>

      <Card style={[{ marginBottom: 16 }, !isEnabled && { opacity: 0.5 }]}>
        <Text style={[fonts.heading3, { color: colors.text, marginBottom: 4 }]}>Preferred Time</Text>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 16 }]}>
          Choose when you'd like to receive your daily tip
        </Text>
        <View style={styles.timePicker}>
          <TouchableOpacity style={[styles.timeBtn, { backgroundColor: colors.background }]} onPress={() => cycleTime("down")} disabled={!isEnabled}>
            <Ionicons name="chevron-down" size={28} color={isEnabled ? colors.primary : colors.disabled} />
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={[fonts.metric, { color: isEnabled ? colors.text : colors.disabled }]}>
              {formatTimeForDisplay(preferredTime)}
            </Text>
            <Text style={[fonts.caption, { color: colors.textLight, marginTop: 2 }]}>{preferredTime}</Text>
          </View>
          <TouchableOpacity style={[styles.timeBtn, { backgroundColor: colors.background }]} onPress={() => cycleTime("up")} disabled={!isEnabled}>
            <Ionicons name="chevron-up" size={28} color={isEnabled ? colors.primary : colors.disabled} />
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={[{ marginBottom: 16 }, !isEnabled && { opacity: 0.5 }]}>
        <Text style={[fonts.heading3, { color: colors.text, marginBottom: 8 }]}>Timezone</Text>
        <View style={[styles.tzRow, { backgroundColor: colors.background }]}>
          <Ionicons name="globe-outline" size={20} color={isEnabled ? colors.primary : colors.disabled} />
          <Text style={[fonts.body, { color: isEnabled ? colors.text : colors.disabled, fontWeight: "500" }]}>{timezone}</Text>
        </View>
        <Text style={[fonts.caption, { color: colors.textLight, marginTop: 8 }]}>
          Automatically detected from your device
        </Text>
      </Card>

      <Button title="Save Preferences" onPress={handleSave} loading={isSaving} icon={<Ionicons name="checkmark-circle" size={20} color="#fff" />} />

      <TouchableOpacity style={styles.reloadBtn} onPress={loadPreferences}>
        <Text style={[fonts.bodySmall, { color: colors.primary, fontWeight: "500" }]}>Reload from server</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleInfo: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12, gap: 12 },
  timePicker: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 },
  timeBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  tzRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  reloadBtn: { alignItems: "center", marginTop: 12 },
});
