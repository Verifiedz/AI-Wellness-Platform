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
import { Colors } from "../theme/colors";
import {
  getDeviceTimezone,
  localTimeToUtc,
  utcToLocalTime,
  formatTimeForDisplay,
} from "../utils/time";

/**
 * Notification preferences screen.
 *
 * - Loads existing preferences from the API (GET /api/notifications/preferences).
 * - Lets the user toggle daily tips on/off.
 * - Lets the user pick a preferred delivery time (local, converted to UTC).
 * - Saves via POST /api/notifications/preferences.
 */
export function NotificationSettingsScreen() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [preferredTime, setPreferredTime] = useState("09:00"); // local HH:mm
  const [timezone, setTimezone] = useState(getDeviceTimezone());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);

  /* --- build 30-minute interval time slots --- */
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      timeOptions.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      );
    }
  }

  /* --- load preferences --- */
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

        // Always use the device's actual timezone for display and conversion.
        // The stored timezone may be the "UTC" default from device registration
        // rather than the user's real timezone.
        const deviceTz = getDeviceTimezone();
        setTimezone(deviceTz);

        if (result.data.preferredTimeUtc) {
          const local = utcToLocalTime(
            result.data.preferredTimeUtc,
            deviceTz
          );
          setPreferredTime(local);
        }
      }
    } catch {
      Alert.alert("Error", "Failed to load notification preferences.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  /* --- save preferences --- */
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const preferredTimeUtc = localTimeToUtc(preferredTime, timezone);
      const result = await notificationApi.savePreferences({
        isEnabled,
        preferredTimeUtc,
        timezone,
      });

      if (result.error) {
        Alert.alert("Error", result.error);
      } else {
        setHasExisting(true);
        Alert.alert("Success", "Notification preferences saved!");
      }
    } catch {
      Alert.alert("Error", "Failed to save preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  /* --- time stepper --- */
  const cycleTime = (direction) => {
    const idx = timeOptions.indexOf(preferredTime);
    const cur = idx === -1 ? 18 : idx; // default 09:00 (index 18)
    const next =
      direction === "up"
        ? (cur + 1) % timeOptions.length
        : (cur - 1 + timeOptions.length) % timeOptions.length;
    setPreferredTime(timeOptions[next]);
  };

  /* --- loading state --- */
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading preferences…</Text>
      </View>
    );
  }

  /* --- main UI --- */
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Info banner when no preferences exist */}
      {!hasExisting && (
        <View style={styles.infoBanner}>
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.infoBannerText}>
            No notification preferences set yet. Configure your daily tips
            below.
          </Text>
        </View>
      )}

      {/* ---- Enable toggle ---- */}
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={24} color={Colors.primary} />
            <View style={styles.settingTexts}>
              <Text style={styles.settingLabel}>Daily Wellness Tips</Text>
              <Text style={styles.settingDesc}>
                Receive a daily wellness tip at your preferred time
              </Text>
            </View>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={setIsEnabled}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={isEnabled ? Colors.primary : "#f4f3f4"}
            ios_backgroundColor={Colors.border}
          />
        </View>
      </View>

      {/* ---- Time picker ---- */}
      <View style={[styles.card, !isEnabled && styles.cardDisabled]}>
        <Text style={styles.cardTitle}>Preferred Time</Text>
        <Text style={styles.cardDesc}>
          Choose when you'd like to receive your daily tip
        </Text>

        <View style={styles.timePicker}>
          <TouchableOpacity
            style={styles.timeBtn}
            onPress={() => cycleTime("down")}
            disabled={!isEnabled}
          >
            <Ionicons
              name="chevron-down"
              size={28}
              color={isEnabled ? Colors.primary : Colors.disabled}
            />
          </TouchableOpacity>

          <View style={styles.timeDisplay}>
            <Text
              style={[styles.timeText, !isEnabled && styles.timeTextDisabled]}
            >
              {formatTimeForDisplay(preferredTime)}
            </Text>
            <Text style={styles.time24}>{preferredTime}</Text>
          </View>

          <TouchableOpacity
            style={styles.timeBtn}
            onPress={() => cycleTime("up")}
            disabled={!isEnabled}
          >
            <Ionicons
              name="chevron-up"
              size={28}
              color={isEnabled ? Colors.primary : Colors.disabled}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ---- Timezone ---- */}
      <View style={[styles.card, !isEnabled && styles.cardDisabled]}>
        <Text style={styles.cardTitle}>Timezone</Text>
        <View style={styles.tzDisplay}>
          <Ionicons
            name="globe-outline"
            size={20}
            color={isEnabled ? Colors.primary : Colors.disabled}
          />
          <Text style={[styles.tzText, !isEnabled && styles.tzTextDisabled]}>
            {timezone}
          </Text>
        </View>
        <Text style={styles.tzHint}>
          Automatically detected from your device. The selected time is
          converted to UTC before being sent to the server.
        </Text>
      </View>

      {/* ---- Save button ---- */}
      <TouchableOpacity
        style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={isSaving}
        activeOpacity={0.8}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>Save Preferences</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Reload link */}
      <TouchableOpacity style={styles.reloadBtn} onPress={loadPreferences}>
        <Text style={styles.reloadText}>Reload from server</Text>
      </TouchableOpacity>
    </ScrollView>
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
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { padding: 16, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: Colors.textSecondary,
  },

  /* info banner */
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${Colors.primaryLight}20`,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  infoBannerText: { flex: 1, fontSize: 13, color: Colors.primary },

  /* cards */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...cardShadow,
  },
  cardDisabled: { opacity: 0.5 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },

  /* toggle row */
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    gap: 12,
  },
  settingTexts: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: "600", color: Colors.text },
  settingDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  /* time picker */
  timePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  timeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  timeDisplay: { alignItems: "center" },
  timeText: { fontSize: 32, fontWeight: "700", color: Colors.text },
  timeTextDisabled: { color: Colors.disabled },
  time24: { fontSize: 12, color: Colors.textLight, marginTop: 2 },

  /* timezone */
  tzDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tzText: { fontSize: 15, color: Colors.text, fontWeight: "500" },
  tzTextDisabled: { color: Colors.disabled },
  tzHint: { fontSize: 12, color: Colors.textLight, marginTop: 8 },

  /* save */
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "600" },

  /* reload */
  reloadBtn: { alignItems: "center", marginTop: 12 },
  reloadText: { fontSize: 14, color: Colors.primary, fontWeight: "500" },
});
