import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  isToday,
  getDay,
  getDaysInMonth,
} from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { journalApi } from '../services/journalApi';
import { MOOD_COLORS } from '../constants/journal';
import { Card } from '../components/Card';
import { ChipGroup } from '../components/ChipGroup';
import { Banner } from '../components/Banner';
import { CalendarSkeleton } from '../components/skeletons/CalendarSkeleton';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const VIEW_MODES = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'yearly', label: 'Yearly' },
];

export function MoodCalendarScreen({ navigation }) {
  const { colors, fonts } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('monthly');
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let startDate, endDate;
      if (viewMode === 'monthly') {
        startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      } else if (viewMode === 'weekly') {
        startDate = format(startOfWeek(currentDate), 'yyyy-MM-dd');
        endDate = format(endOfWeek(currentDate), 'yyyy-MM-dd');
      } else {
        startDate = `${currentDate.getFullYear()}-01-01`;
        endDate = `${currentDate.getFullYear()}-12-31`;
      }

      const entryLimit = viewMode === 'yearly' ? 366 : 31;
      const [entriesResult, summaryResult] = await Promise.all([
        journalApi.getEntries({ startDate, endDate, limit: entryLimit }),
        journalApi.getMoodSummary({ startDate, endDate }),
      ]);

      if (!entriesResult.error && entriesResult.data) setEntries(entriesResult.data);
      if (!summaryResult.error && summaryResult.data) setSummary(summaryResult.data);
    } catch {
      setError('Failed to load mood data. Tap to retry.');
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload calendar data when the screen regains focus so that new journal
  // entries created on JournalScreen are reflected without a manual refresh.
  // Skip the first focus event since the mount useEffect above already loaded data.
  const hasMountedFocusRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasMountedFocusRef.current) {
        hasMountedFocusRef.current = true;
        return () => {};
      }
      loadData();
      return () => {};
    }, [loadData])
  );

  const getEntryForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.find((e) => e.entryDate === dateStr);
  };

  const navigatePrevious = () => {
    if (viewMode === 'monthly') setCurrentDate((d) => subMonths(d, 1));
    else if (viewMode === 'weekly') setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => new Date(d.getFullYear() - 1, d.getMonth(), d.getDate()));
  };

  const navigateNext = () => {
    if (viewMode === 'monthly') setCurrentDate((d) => addMonths(d, 1));
    else if (viewMode === 'weekly') setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()));
  };

  const getHeaderTitle = () => {
    if (viewMode === 'monthly') return format(currentDate, 'MMMM yyyy');
    if (viewMode === 'weekly') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    return String(currentDate.getFullYear());
  };

  const handleDateTap = (date) => {
    const entry = getEntryForDate(date);
    if (entry) {
      navigation.navigate('JournalHome', { selectedDate: format(date, 'yyyy-MM-dd') });
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
          style={[
            styles.dayCell,
            today && { backgroundColor: `${colors.primaryLight}20`, borderRadius: 10 },
          ]}
          onPress={() => handleDateTap(date)}
        >
          <Text
            style={[
              fonts.bodySmall,
              { color: today ? colors.primary : colors.text, fontWeight: today ? '700' : '400' },
            ]}
          >
            {day}
          </Text>
          {entry && (
            <View
              style={[styles.moodDot, { backgroundColor: MOOD_COLORS[entry.mood] || '#ccc' }]}
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
              <Text style={[fonts.caption, { color: colors.textSecondary }]}>{name}</Text>
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
              style={[
                styles.weekRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: today ? colors.primary : colors.border,
                  borderWidth: today ? 2 : 1,
                },
              ]}
              onPress={() => handleDateTap(date)}
            >
              <View>
                <Text style={[fonts.caption, { color: colors.textSecondary }]}>
                  {DAY_NAMES[idx]}
                </Text>
                <Text style={[fonts.body, { color: colors.text, marginTop: 2 }]}>
                  {format(date, 'MMM d')}
                </Text>
              </View>
              {entry ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={[
                      styles.weekMoodDot,
                      { backgroundColor: MOOD_COLORS[entry.mood] || '#ccc' },
                    ]}
                  />
                  <Text style={[fonts.body, { color: colors.text, textTransform: 'capitalize' }]}>
                    {entry.mood}
                  </Text>
                </View>
              ) : (
                <Text style={[fonts.bodySmall, { color: colors.textLight, fontStyle: 'italic' }]}>
                  No entry
                </Text>
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
          const dominant = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0];

          return (
            <TouchableOpacity
              key={month}
              style={[
                styles.yearCard,
                { borderColor: colors.border, backgroundColor: colors.background },
              ]}
              onPress={() => {
                setCurrentDate(new Date(year, month, 1));
                setViewMode('monthly');
              }}
            >
              <Text style={[fonts.body, { color: colors.text, fontWeight: '600' }]}>
                {format(new Date(year, month), 'MMM')}
              </Text>
              <Text style={[fonts.caption, { color: colors.textSecondary }]}>
                {monthEntries.length} entries
              </Text>
              {dominant && (
                <View
                  style={[
                    styles.yearMoodDot,
                    { backgroundColor: MOOD_COLORS[dominant[0]] || '#ccc' },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <ChipGroup
        items={VIEW_MODES}
        selected={viewMode}
        onSelect={setViewMode}
        style={{ marginBottom: 16 }}
      />

      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={navigatePrevious}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[fonts.heading3, { color: colors.text }]}>{getHeaderTitle()}</Text>
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={navigateNext}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {summary && (
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
            <Text style={[fonts.heading3, { color: colors.text }]}>Summary</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[fonts.heading2, { color: colors.text }]}>
                {summary.totalEntries ?? 0}
              </Text>
              <Text style={[fonts.caption, { color: colors.textSecondary }]}>Entries</Text>
            </View>
            <View style={styles.summaryItem}>
              {summary.mostCommonMood ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={[
                        styles.summaryMoodDot,
                        { backgroundColor: MOOD_COLORS[summary.mostCommonMood] || '#ccc' },
                      ]}
                    />
                    <Text
                      style={[
                        fonts.body,
                        { color: colors.text, fontWeight: '600', textTransform: 'capitalize' },
                      ]}
                    >
                      {summary.mostCommonMood}
                    </Text>
                  </View>
                  <Text style={[fonts.caption, { color: colors.textSecondary }]}>Top Mood</Text>
                </>
              ) : (
                <Text style={[fonts.caption, { color: colors.textSecondary }]}>No data</Text>
              )}
            </View>
            <View style={styles.summaryItem}>
              <Text style={[fonts.heading2, { color: colors.text }]}>
                {summary.averageEnergy ? Number(summary.averageEnergy).toFixed(1) : '—'}
              </Text>
              <Text style={[fonts.caption, { color: colors.textSecondary }]}>Avg Energy</Text>
            </View>
          </View>
        </Card>
      )}

      {error && <Banner variant="error" message={error} action="Retry" onAction={loadData} />}

      <Card style={{ marginBottom: 16 }}>
        {loading ? (
          <CalendarSkeleton />
        ) : (
          <>
            {viewMode === 'monthly' && renderMonthlyView()}
            {viewMode === 'weekly' && renderWeeklyView()}
            {viewMode === 'yearly' && renderYearlyView()}
          </>
        )}
      </Card>

      <Card>
        <Text style={[fonts.heading3, { color: colors.text, marginBottom: 10 }]}>Mood Legend</Text>
        <View style={styles.legendRow}>
          {Object.entries(MOOD_COLORS).map(([mood, color]) => (
            <View key={mood} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={[fonts.bodySmall, { color: colors.text, textTransform: 'capitalize' }]}>
                {mood}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', gap: 4 },
  summaryMoodDot: { width: 14, height: 14, borderRadius: 7 },
  dayNamesRow: { flexDirection: 'row', marginBottom: 4 },
  dayNameCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 8, gap: 3 },
  moodDot: { width: 8, height: 8, borderRadius: 4 },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
  },
  weekMoodDot: { width: 14, height: 14, borderRadius: 7 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  yearCard: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  yearMoodDot: { width: 20, height: 20, borderRadius: 10, marginTop: 4 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
});
