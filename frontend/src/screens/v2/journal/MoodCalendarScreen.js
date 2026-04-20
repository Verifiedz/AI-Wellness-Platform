/**
 * MoodCalendarScreen v2 — month / week / year views, mood-token dots.
 *
 * Behavior preserved:
 *   - journalApi.getEntries / getMoodSummary contracts unchanged
 *   - View mode chips (Monthly, Weekly, Yearly)
 *   - Tap a dated cell with an entry → navigates to JournalHome with that date
 *   - useFocusEffect refresh-on-return
 *   - Pull-to-refresh
 *
 * Visual rewrite: ScreenScaffold w/ subtle aurora, v2 Cards/Chips, themed
 * mood dots via MOOD_TOKENS palette tokens (no more hardcoded #6BAF7D etc.).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
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
import { CaretLeft, CaretRight, ChartBar } from 'phosphor-react-native';
import { journalApi } from '../../../services/journalApi';
import { useV2Theme } from '../../../theme/v2';
import {
  Card,
  Chip,
  ErrorState,
  IconButton,
  LoadingState,
  ScreenHeader,
  ScreenScaffold,
  Surface,
  Text,
} from '../../../ui/v2';
import { MOOD_TOKENS, getMoodToken } from '../home/moodTokens';

const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const VIEW_MODES = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'yearly', label: 'Yearly' },
];

function moodColor(palette, moodId) {
  const token = getMoodToken(moodId);
  return token ? token.colorOf(palette) : palette.text.tertiary;
}

export function MoodCalendarScreen({ navigation }) {
  const v2 = useV2Theme();
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
      let startDate;
      let endDate;
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
      setError('Failed to load mood data.');
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasMountedFocusRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasMountedFocusRef.current) {
        hasMountedFocusRef.current = true;
        return undefined;
      }
      loadData();
      return undefined;
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const entryByDate = useMemo(() => {
    const map = new Map();
    entries.forEach((e) => map.set(e.entryDate, e));
    return map;
  }, [entries]);

  const navPrev = useCallback(() => {
    if (viewMode === 'monthly') setCurrentDate((d) => subMonths(d, 1));
    else if (viewMode === 'weekly') setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => new Date(d.getFullYear() - 1, d.getMonth(), d.getDate()));
  }, [viewMode]);

  const navNext = useCallback(() => {
    if (viewMode === 'monthly') setCurrentDate((d) => addMonths(d, 1));
    else if (viewMode === 'weekly') setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()));
  }, [viewMode]);

  const headerTitle = useMemo(() => {
    if (viewMode === 'monthly') return format(currentDate, 'MMMM yyyy');
    if (viewMode === 'weekly') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
    }
    return String(currentDate.getFullYear());
  }, [currentDate, viewMode]);

  const handleDateTap = useCallback(
    (date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = entryByDate.get(dateStr);
      if (entry) {
        navigation.navigate('JournalHome', { selectedDate: dateStr });
      }
    },
    [entryByDate, navigation]
  );

  return (
    <ScreenScaffold
      ambient
      ambientIntensity="subtle"
      paddingBottom="tabBar"
      refreshControl={{ refreshing, onRefresh }}
    >
      <ScreenHeader
        title="Mood calendar"
        subtitle={headerTitle}
        onBack={() => navigation.goBack()}
        right={
          <View style={{ flexDirection: 'row', gap: v2.spacing[1] }}>
            <IconButton
              icon={CaretLeft}
              accessibilityLabel="Previous"
              onPress={navPrev}
              variant="solid"
              size="sm"
            />
            <IconButton
              icon={CaretRight}
              accessibilityLabel="Next"
              onPress={navNext}
              variant="solid"
              size="sm"
            />
          </View>
        }
      />

      <View style={{ flexDirection: 'row', gap: v2.spacing[2], marginTop: v2.spacing[2] }}>
        {VIEW_MODES.map((m) => (
          <Chip
            key={m.id}
            selected={viewMode === m.id}
            onPress={() => setViewMode(m.id)}
            accessibilityLabel={`${m.label} view`}
          >
            {m.label}
          </Chip>
        ))}
      </View>

      {summary ? (
        <Card padding={4} style={{ marginTop: v2.spacing[4] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
            <ChartBar size={20} color={v2.palette.primary} weight="duotone" />
            <Text variant="h3">Summary</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              marginTop: v2.spacing[3],
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text variant="h2">{summary.totalEntries ?? 0}</Text>
              <Text variant="caption" color="tertiary">
                Entries
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              {summary.mostCommonMood ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: moodColor(v2.palette, summary.mostCommonMood),
                      }}
                    />
                    <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold', textTransform: 'capitalize' }}>
                      {summary.mostCommonMood}
                    </Text>
                  </View>
                  <Text variant="caption" color="tertiary">
                    Top mood
                  </Text>
                </>
              ) : (
                <Text variant="caption" color="tertiary">
                  No data
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text variant="h2">
                {summary.averageEnergy ? Number(summary.averageEnergy).toFixed(1) : '—'}
              </Text>
              <Text variant="caption" color="tertiary">
                Avg energy
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      {error ? (
        <ErrorState
          title="Couldn’t load mood data"
          body={error}
          onRetry={loadData}
          actionLabel="Retry"
        />
      ) : loading ? (
        <View style={{ marginTop: v2.spacing[4] }}>
          <LoadingState caption="Reading your patterns" />
        </View>
      ) : (
        <View style={{ marginTop: v2.spacing[4] }}>
          {viewMode === 'monthly' ? (
            <MonthlyView
              currentDate={currentDate}
              entryByDate={entryByDate}
              onTap={handleDateTap}
              v2={v2}
            />
          ) : null}
          {viewMode === 'weekly' ? (
            <WeeklyView
              currentDate={currentDate}
              entryByDate={entryByDate}
              onTap={handleDateTap}
              v2={v2}
            />
          ) : null}
          {viewMode === 'yearly' ? (
            <YearlyView
              currentDate={currentDate}
              entries={entries}
              onMonthTap={(month) => {
                setCurrentDate(new Date(currentDate.getFullYear(), month, 1));
                setViewMode('monthly');
              }}
              v2={v2}
            />
          ) : null}
        </View>
      )}

      {/* Mood legend */}
      <Card padding={4} style={{ marginTop: v2.spacing[4] }}>
        <Text variant="h3">Mood legend</Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: v2.spacing[3],
            marginTop: v2.spacing[3],
          }}
        >
          {MOOD_TOKENS.map(({ id, label, colorOf }) => (
            <View
              key={id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colorOf(v2.palette),
                }}
              />
              <Text variant="body-sm" color="secondary">
                {label}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </ScreenScaffold>
  );
}

function MonthlyView({ currentDate, entryByDate, onTap, v2 }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfWeek = getDay(new Date(year, month, 1));

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ key: `empty-${i}`, day: null });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ key: `d-${day}`, day });
  }

  return (
    <Card padding={4}>
      <View style={{ flexDirection: 'row' }}>
        {DAY_NAMES.map((n, idx) => (
          <View key={`${n}-${idx}`} style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
            <Text variant="caption" color="tertiary">
              {n}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((c) => {
          if (c.day === null) {
            return <View key={c.key} style={{ width: '14.2857%', paddingVertical: 8 }} />;
          }
          const date = new Date(year, month, c.day);
          const dateStr = format(date, 'yyyy-MM-dd');
          const entry = entryByDate.get(dateStr);
          const today = isToday(date);
          return (
            <Pressable
              key={c.key}
              accessibilityRole="button"
              accessibilityLabel={
                entry
                  ? `${format(date, 'MMMM d')} — ${entry.mood}`
                  : `${format(date, 'MMMM d')}, no entry`
              }
              onPress={() => onTap(date)}
              style={{
                width: '14.2857%',
                alignItems: 'center',
                paddingVertical: 8,
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: today ? v2.palette.bg.surfaceHigh : 'transparent',
                  borderWidth: today ? 1 : 0,
                  borderColor: v2.palette.primary,
                }}
              >
                <Text
                  variant="body-sm"
                  style={{
                    color: today ? v2.palette.primary : v2.palette.text.primary,
                    fontFamily: today ? 'DMSans_700Bold' : 'DMSans_400Regular',
                  }}
                >
                  {c.day}
                </Text>
              </View>
              {entry ? (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: moodColor(v2.palette, entry.mood),
                  }}
                />
              ) : (
                <View style={{ height: 8 }} />
              )}
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function WeeklyView({ currentDate, entryByDate, onTap, v2 }) {
  const start = startOfWeek(currentDate);
  const end = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start, end });
  const FULL_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <View style={{ gap: v2.spacing[2] }}>
      {days.map((date, idx) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const entry = entryByDate.get(dateStr);
        const today = isToday(date);
        return (
          <Pressable
            key={dateStr}
            accessibilityRole="button"
            accessibilityLabel={
              entry
                ? `${format(date, 'EEEE, MMMM d')} — ${entry.mood}`
                : `${format(date, 'EEEE, MMMM d')}, no entry`
            }
            onPress={() => onTap(date)}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 14,
              borderRadius: v2.radius.lg,
              backgroundColor: v2.palette.bg.surface,
              borderWidth: today ? 2 : 1,
              borderColor: today ? v2.palette.primary : v2.palette.border.subtle,
            }}
          >
            <View>
              <Text variant="caption" color="tertiary">
                {FULL_DAY[idx]}
              </Text>
              <Text variant="body" style={{ marginTop: 2 }}>
                {format(date, 'MMM d')}
              </Text>
            </View>
            {entry ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: moodColor(v2.palette, entry.mood),
                  }}
                />
                <Text variant="body" style={{ textTransform: 'capitalize' }}>
                  {entry.mood}
                </Text>
              </View>
            ) : (
              <Text variant="body-sm" color="tertiary" style={{ fontStyle: 'italic' }}>
                No entry
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function YearlyView({ currentDate, entries, onMonthTap, v2 }) {
  const months = Array.from({ length: 12 }, (_, i) => i);
  const year = currentDate.getFullYear();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: v2.spacing[2] }}>
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
          <Pressable
            key={month}
            accessibilityRole="button"
            accessibilityLabel={`${format(new Date(year, month), 'MMMM yyyy')}, ${monthEntries.length} entries`}
            onPress={() => onMonthTap(month)}
            style={{
              width: '31%',
              alignItems: 'center',
              padding: 12,
              borderRadius: v2.radius.lg,
              backgroundColor: v2.palette.bg.surface,
              borderWidth: 1,
              borderColor: v2.palette.border.subtle,
              gap: 4,
            }}
          >
            <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }}>
              {format(new Date(year, month), 'MMM')}
            </Text>
            <Text variant="caption" color="tertiary">
              {monthEntries.length} {monthEntries.length === 1 ? 'entry' : 'entries'}
            </Text>
            {dominant ? (
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  marginTop: 2,
                  backgroundColor: moodColor(v2.palette, dominant[0]),
                }}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export default MoodCalendarScreen;
