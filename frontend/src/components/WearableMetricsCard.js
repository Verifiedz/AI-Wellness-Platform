import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Card } from "../components/Card";

/**
 * Card displaying today's wearable health metrics.
 *
 * @param {{ steps: number|null, heartRate: number|null, sleepHours: number|null }} props
 */
export function WearableMetricsCard({ steps, heartRate, sleepHours }) {
  const { colors, fonts } = useTheme();

  const hasData = steps !== null || heartRate !== null || sleepHours !== null;
  if (!hasData) return null;

  const metrics = [
    { icon: "footsteps-outline", label: "Steps", value: steps != null ? steps.toLocaleString() : "--", color: colors.primary },
    { icon: "heart-outline", label: "Heart Rate", value: heartRate != null ? `${heartRate} bpm` : "--", color: colors.error },
    { icon: "moon-outline", label: "Sleep", value: sleepHours != null ? `${sleepHours}h` : "--", color: colors.accent },
  ];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="fitness-outline" size={18} color={colors.primary} />
        <Text style={[fonts.heading3, { color: colors.text }]}>Today's Health</Text>
      </View>
      <View style={styles.metricsRow}>
        {metrics.map((m) => (
          <View key={m.label} style={styles.metric}>
            <Ionicons name={m.icon} size={22} color={m.color} />
            <Text style={[fonts.heading3, { color: colors.text, marginTop: 4 }]}>
              {m.value}
            </Text>
            <Text style={[fonts.caption, { color: colors.textSecondary }]}>
              {m.label}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  metricsRow: { flexDirection: "row", justifyContent: "space-around" },
  metric: { alignItems: "center", gap: 2 },
});
