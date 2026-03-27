import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "../Skeleton";
import { Card } from "../Card";

/**
 * Skeleton placeholder matching the JournalScreen layout:
 * mood selector, energy row, emotions chips, and text area.
 */
export function JournalSkeleton() {
  return (
    <View style={styles.container}>
      {/* Mood card */}
      <Card style={styles.card}>
        <Skeleton width={160} height={14} />
        <Skeleton width={200} height={12} style={styles.mt8} />
        <View style={styles.moodRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width={58} height={70} borderRadius={16} />
          ))}
        </View>
      </Card>

      {/* Energy card */}
      <Card style={styles.card}>
        <Skeleton width={120} height={14} />
        <Skeleton width={180} height={12} style={styles.mt8} />
        <View style={styles.energyRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width={0} height={46} borderRadius={12} style={{ flex: 1 }} />
          ))}
        </View>
      </Card>

      {/* Emotions card */}
      <Card style={styles.card}>
        <Skeleton width={90} height={14} />
        <View style={styles.chipRow}>
          {[80, 70, 90, 60, 75, 85, 65].map((w, i) => (
            <Skeleton key={i} width={w} height={36} borderRadius={20} />
          ))}
        </View>
      </Card>

      {/* Journal text area */}
      <Card style={styles.card}>
        <Skeleton width={110} height={14} />
        <Skeleton width="100%" height={120} borderRadius={12} style={styles.mt10} />
        <Skeleton width={90} height={10} style={[styles.mt6, { alignSelf: "flex-end" }]} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  card: { marginBottom: 0 },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 16,
  },
  energyRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  mt6: { marginTop: 6 },
  mt8: { marginTop: 8 },
  mt10: { marginTop: 10 },
});
