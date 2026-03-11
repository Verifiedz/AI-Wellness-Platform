import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  getDay,
  getDaysInMonth,
} from "date-fns";
import { useTheme } from "../context/ThemeContext";
import { journalApi } from "../services/journalApi";

const MOOD_COLORS = {
  great: "#00B894",
  good: "#4A90D9",
  okay: "#FDCB6E",
  low: "#B2BEC3",
  tough: "#E17055",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MoodCalendarScreen({ navigation }) {
  const { colors } = useTheme();
  const Colors = colors;
  const styles = createStyles(Colors);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("monthly");
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let startDate, endDate;

      if (viewMode === "monthly") {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        startDate = format(start, "yyyy-MM-dd");
        endDate = format(end, "yyyy-MM-dd");
      } else if (viewMode === "weekly") {
        const start = startOfWeek(currentDate);
        const end = endOfWeek(currentDate);
        startDate = format(start, "yyyy-MM-dd");
        endDate = format(end, "yyyy-MM-dd");
      } else {
        startDate = `${currentDate.getFullYear()}-01-01`;
        endDate = `${currentDate.getFullYear()}-12-31`;
      }

      const [entriesResult, summaryResult] = await Promise.all([
        journalApi.getEntries({ startDate, endDate, limit: 366 }),
        journalApi.getMoodSummary({ startDate, endDate }),
      ]);

      if (!entriesResult.error && entriesResult.data) {
        setEntries(entriesResult.data);
      }
      if (!summaryResult.error && summaryResult.data) {
        setSummary(summaryResult.data);
      }
    } catch {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getEntryForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return entries.find((e) => e.entryDate === dateStr);
  };

  const navigatePrevious = () => {
    if (viewMode === "monthly") setCurrentDate((d) => subMonths(d, 1));
    else if (viewMode === "weekly") setCurrentDate((d) => subWeeks(d, 1));
    else
      setCurrentDate(
        (d) => new Date(d.getFullYear() - 1, d.getMonth(), d.getDate())
      );
  };

  const navigateNext = () => {
    if (viewMode === "monthly") setCurrentDate((d) => addMonths(d, 1));
    else if (viewMode === "weekly") setCurrentDate((d) => addWeeks(d, 1));
    else
      setCurrentDate(
        (d) => new Date(d.getFullYear() + 1, d.getMonth(), d.getDate())
      );
  };

  const getHeaderTitle = () => {
    if (viewMode === "monthly") return format(currentDate, "MMMM yyyy");
    if (viewMode === "weekly") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    return String(currentDate.getFullYear());
  };

  const handleDateTap = (date) => {
    const entry = getEntryForDate(date);
    if (entry) {
      navigation.navigate("Journal");
    }
  };

  const renderMonthlyView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfWeek = getDay(new Date(year, month, 1));

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const entry = getEntryForDate(date);
      const today = isToday(date);

      cells.push(
        <TouchableOpacity
          key={day}
          style={[styles.dayCell, today && styles.dayCellToday]}
          onPress={() => handleDateTap(date)}
        >
          <Text style={[styles.dayNumber, today && styles.dayNumberToday]}>
            {day}
          </Text>
          {entry && (
            <View
              style={[
                styles.moodDot,
                { backgroundColor: MOOD_COLORS[entry.mood] || "#ccc" },
              ]}
            />
          )}
        </TouchableOpacity>
      );
    }

    return (
      <View>
        <View style={styles.dayNamesRow}>
          {DAY_NAMES.map((name) => (
            <View key={name} style={styles.dayNameCell}>
              <Text style={styles.dayNameText}>{name}</Text>
            </View>
          ))}
        </View>
        <View style={styles.calendarGrid}>{cells}</View>
      </View>
    );
  };

  const renderWeeklyView = () => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start, end });

    return (
      <View style={{ gap: 8 }}>
        {days.map((date, idx) => {
          const entry = getEntryForDate(date);
          const today = isToday(date);
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.weekRow, today && styles.weekRowToday]}
              onPress={() => handleDateTap(date)}
            >
              <View>
                <Text style={styles.weekDayName}>{DAY_NAMES[idx]}</Text>
                <Text style={styles.weekDate}>
                  {format(date, "MMM d")}
                </Text>
              </View>
              {entry ? (
                <View style={styles.weekMoodContainer}>
                  <View
                    style={[
                      styles.weekMoodDot,
                      {
                        backgroundColor:
                          MOOD_COLORS[entry.mood] || "#ccc",
                      },
                    ]}
                  />
                  <Text style={styles.weekMoodLabel}>{entry.mood}</Text>
                </View>
              ) : (
                <Text style={styles.weekNoEntry}>No entry</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderYearlyView = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const year = currentDate.getFullYear();

    return (
      <View style={styles.yearGrid}>
        {months.map((month) => {
          const monthEntries = entries.filter((e) => {
            const d = new Date(e.entryDate);
            return d.getMonth() === month && d.getFullYear() === year;
          });

          const moodCounts = {};
          monthEntries.forEach((e) => {
            moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
          });
          const dominant = Object.entries(moodCounts).sort(
            ([, a], [, b]) => b - a
          )[0];

          return (
            <View key={month} style={styles.yearCard}>
              <Text style={styles.yearMonthName}>
                {format(new Date(year, month), "MMM")}
              </Text>
              <Text style={styles.yearEntryCount}>
                {monthEntries.length} entries
              </Text>
              {dominant && (
                <View
                  style={[
                    styles.yearMoodDot,
                    {
                      backgroundColor:
                        MOOD_COLORS[dominant[0]] || "#ccc",
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* View Mode Selector */}
      <View style={styles.viewModeRow}>
        {["monthly", "weekly", "yearly"].map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.viewModeButton,
              viewMode === mode && styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode(mode)}
          >
            <Text
              style={[
                styles.viewModeText,
                viewMode === mode && styles.viewModeTextActive,
              ]}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navButton} onPress={navigatePrevious}>
          <Ionicons
            name="chevron-back"
            size={20}
            color={Colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{getHeaderTitle()}</Text>
        <TouchableOpacity style={styles.navButton} onPress={navigateNext}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      {summary && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="bar-chart-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.cardTitle}>Summary</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {summary.totalEntries ?? 0}
              </Text>
              <Text style={styles.summaryLabel}>Total Entries</Text>
            </View>
            <View style={styles.summaryItem}>
              {summary.mostCommonMood ? (
                <>
                  <View style={styles.summaryMoodRow}>
                    <View
                      style={[
                        styles.summaryMoodDot,
                        {
                          backgroundColor:
                            MOOD_COLORS[summary.mostCommonMood] || "#ccc",
                        },
                      ]}
                    />
                    <Text style={styles.summaryMoodText}>
                      {summary.mostCommonMood}
                    </Text>
                  </View>
                  <Text style={styles.summaryLabel}>Most Common</Text>
                </>
              ) : (
                <Text style={styles.summaryLabel}>No data</Text>
              )}
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {summary.averageEnergy
                  ? Number(summary.averageEnergy).toFixed(1)
                  : "—"}
              </Text>
              <Text style={styles.summaryLabel}>Avg Energy</Text>
            </View>
          </View>
        </View>
      )}

      {/* Calendar */}
      <View style={styles.card}>
        {loading ? (
          <View style={styles.calendarLoading}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          <>
            {viewMode === "monthly" && renderMonthlyView()}
            {viewMode === "weekly" && renderWeeklyView()}
            {viewMode === "yearly" && renderYearlyView()}
          </>
        )}
      </View>

      {/* Legend */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { marginBottom: 10 }]}>
          Mood Legend
        </Text>
        <View style={styles.legendRow}>
          {Object.entries(MOOD_COLORS).map(([mood, color]) => (
            <View key={mood} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>
                {mood.charAt(0).toUpperCase() + mood.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const createStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  viewModeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  viewModeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  viewModeText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  viewModeTextActive: {
    color: "#fff",
  },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
    gap: 4,
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryMoodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryMoodDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  summaryMoodText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
    textTransform: "capitalize",
  },

  dayNamesRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayNameCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: 8,
    gap: 3,
  },
  dayCellToday: {
    backgroundColor: Colors.primaryLight + "22",
    borderRadius: 10,
  },
  dayNumber: {
    fontSize: 14,
    color: Colors.text,
  },
  dayNumberToday: {
    fontWeight: "700",
    color: Colors.primary,
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  calendarLoading: {
    paddingVertical: 40,
    alignItems: "center",
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  weekRowToday: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  weekDayName: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  weekDate: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
    marginTop: 2,
  },
  weekMoodContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weekMoodDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  weekMoodLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    textTransform: "capitalize",
  },
  weekNoEntry: {
    fontSize: 13,
    color: Colors.textLight,
    fontStyle: "italic",
  },

  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  yearCard: {
    width: "30%",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    gap: 4,
  },
  yearMonthName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  yearEntryCount: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  yearMoodDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: 4,
  },

  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: Colors.text,
  },
});
