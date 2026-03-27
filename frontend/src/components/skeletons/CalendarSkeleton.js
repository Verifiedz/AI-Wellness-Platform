import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "../Skeleton";

/**
 * Skeleton placeholder matching the MoodCalendarScreen calendar grid:
 * day-name header row and a 7×5 grid of day cells.
 */
export function CalendarSkeleton() {
  return (
    <View style={styles.container}>
      {/* Day name headers */}
      <View style={styles.headerRow}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`h-${i}`} width={28} height={12} style={styles.headerCell} />
        ))}
      </View>

      {/* Calendar grid — 5 rows of 7 cells */}
      {Array.from({ length: 5 }).map((_, row) => (
        <View key={`r-${row}`} style={styles.gridRow}>
          {Array.from({ length: 7 }).map((_, col) => (
            <View key={`c-${row}-${col}`} style={styles.dayCell}>
              <Skeleton width={20} height={14} borderRadius={4} />
              <Skeleton width={8} height={8} borderRadius={4} style={styles.dot} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  headerCell: { alignSelf: "center" },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 6,
  },
  dayCell: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: 6,
    gap: 3,
  },
  dot: { marginTop: 2 },
});
