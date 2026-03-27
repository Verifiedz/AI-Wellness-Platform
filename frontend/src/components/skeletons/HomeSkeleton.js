import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "../Skeleton";
import { Card } from "../Card";

/**
 * Skeleton placeholder matching the HomeScreen layout:
 * mood selector row, insight card, and quick action cards.
 */
export function HomeSkeleton() {
  return (
    <View style={styles.container}>
      {/* Mood check-in card */}
      <Card style={styles.card}>
        <Skeleton width={180} height={14} />
        <Skeleton width={240} height={12} style={styles.mt8} />
        <View style={styles.moodRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width={58} height={70} borderRadius={16} />
          ))}
        </View>
      </Card>

      {/* Insight card */}
      <Card style={styles.card}>
        <Skeleton width={140} height={14} />
        <Skeleton width="100%" height={12} style={styles.mt10} />
        <Skeleton width="80%" height={12} style={styles.mt6} />
        <Skeleton width="60%" height={12} style={styles.mt6} />
      </Card>

      {/* Quick actions */}
      <View style={styles.actionsRow}>
        <Card style={styles.actionCard}>
          <Skeleton width={52} height={52} borderRadius={16} />
          <Skeleton width={60} height={14} style={styles.mt10} />
          <Skeleton width={80} height={10} style={styles.mt6} />
        </Card>
        <Card style={styles.actionCard}>
          <Skeleton width={52} height={52} borderRadius={16} />
          <Skeleton width={60} height={14} style={styles.mt10} />
          <Skeleton width={80} height={10} style={styles.mt6} />
        </Card>
      </View>
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
  actionsRow: { flexDirection: "row", gap: 14 },
  actionCard: { flex: 1, alignItems: "center", marginBottom: 0 },
  mt6: { marginTop: 6 },
  mt8: { marginTop: 8 },
  mt10: { marginTop: 10 },
});
