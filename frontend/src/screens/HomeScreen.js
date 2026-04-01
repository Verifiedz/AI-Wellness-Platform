import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format, subDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTip } from '../context/TipContext';
import { useTheme } from '../context/ThemeContext';
import { journalApi } from '../services/journalApi';
import { chatApi } from '../services/chatApi';
import { Logo } from '../components/Logo';
import { Card } from '../components/Card';
import { MoodSelector } from '../components/MoodSelector';
import { SectionHeader } from '../components/SectionHeader';
import { AnimatedCard } from '../components/AnimatedCard';
import { usePatternInsights } from '../hooks/usePatternInsights';
import { HomeSkeleton } from '../components/skeletons/HomeSkeleton';
import { getTimePeriodIcon } from '../theme/timeOfDay';
import { useAssessmentReminder } from '../hooks/useAssessmentReminder';
import { ASSESSMENTS } from '../constants/assessments';
import { useWearableData } from '../hooks/useWearableData';
import { WearableMetricsCard } from '../components/WearableMetricsCard';
import { Banner } from '../components/Banner';
import { ResponsiveContainer } from '../components/ResponsiveContainer';

function getDisplayName(user) {
  if (user?.username?.trim()) return user.username.trim();
  if (user?.email?.includes('@')) return user.email.split('@')[0];
  return 'there';
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function buildDateRange(days) {
  const endDate = new Date();
  const startDate = subDays(endDate, Math.max(days - 1, 0));
  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  };
}

export function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { currentTip, clearTip } = useTip();
  const { colors, fonts, isDynamicTheme, timePeriod } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayEntry, setTodayEntry] = useState(null);
  const [quickPrompt, setQuickPrompt] = useState(null);
  const { insights, load: loadInsights, refresh: refreshInsights } = usePatternInsights(30);
  const assessmentReminder = useAssessmentReminder();
  const wearable = useWearableData();
  const hasLoadedRef = useRef(false);

  const loadDashboard = useCallback(async (isSoftRefresh = false) => {
    if (isSoftRefresh) setIsRefreshing(true);
    else setIsInitialLoading(true);

    const today = format(new Date(), 'yyyy-MM-dd');

    try {
      const [todayEntryResult, promptResult] = await Promise.all([
        journalApi.getEntryByDate(today),
        journalApi.getRandomPrompt(),
      ]);

      // A 404 for today's entry just means the user hasn't journaled yet — not an error.
      const entryError = todayEntryResult.error && todayEntryResult.status !== 404
        ? todayEntryResult.error
        : null;
      const promptError = promptResult.error && promptResult.status !== 404
        ? promptResult.error
        : null;
      const firstError = entryError || promptError;

      setError(firstError || null);
      setTodayEntry(todayEntryResult.data || null);
      setQuickPrompt(promptResult.data || null);
    } catch (err) {
      const isNetwork =
        err instanceof TypeError || (err.message && err.message.toLowerCase().includes('network'));
      setError(isNetwork ? 'No internet connection' : 'Failed to load dashboard');
    } finally {
      if (isSoftRefresh) setIsRefreshing(false);
      else setIsInitialLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const soft = hasLoadedRef.current;
      hasLoadedRef.current = true;
      loadDashboard(soft);
      if (soft) refreshInsights();
      else loadInsights();
    }, [loadDashboard, loadInsights, refreshInsights])
  );

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const greeting = useMemo(() => getGreeting(), []);
  const todayDate = useMemo(() => format(new Date(), 'EEEE, MMMM d'), []);

  const goToJournal = useCallback(
    (mood) => {
      navigation.navigate('Journal', {
        screen: 'JournalHome',
        params: mood ? { preselectedMood: mood, _ts: Date.now() } : undefined,
      });
    },
    [navigation]
  );

  const goToAIChat = useCallback(() => {
    navigation.navigate('Sakina', {
      screen: 'ChatDrawer',
      params: {
        screen: 'AIChatConversation',
        params: { sessionId: null, forceNewAt: Date.now() },
      },
    });
  }, [navigation]);

  const goToBreathe = useCallback(() => {
    navigation.navigate('BreathingExercise');
  }, [navigation]);

  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            loadDashboard(true);
            refreshInsights();
          }}
        />
      }
    >
      <ResponsiveContainer>
      {/* Greeting */}
      <View style={styles.greetingSection}>
        <View style={styles.greetingRow}>
          <Logo size="small" showText={false} />
          <View style={styles.greetingText}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isDynamicTheme && (
                <Ionicons name={getTimePeriodIcon(timePeriod)} size={22} color={colors.secondary} />
              )}
              <Text style={[fonts.heading1, { color: colors.text, flex: 1 }]}>
                {greeting}, {displayName}
              </Text>
            </View>
            <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
              {todayDate}
            </Text>
          </View>
        </View>
      </View>

      {error && (
        <Banner
          variant="error"
          message={error}
          action="Retry"
          onAction={() => {
            loadDashboard(true);
            refreshInsights();
          }}
          onDismiss={() => setError(null)}
        />
      )}

      {isInitialLoading ? (
        <HomeSkeleton />
      ) : (
        <>
          {/* Daily Check-in */}
          <AnimatedCard index={0}>
            <SectionHeader title="How are you feeling?" />
            <Card style={{ marginBottom: 20 }}>
              {todayEntry ? (
                <View style={styles.checkedInRow}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  <Text style={[fonts.body, { color: colors.text, flex: 1 }]}>
                    You've already checked in today
                  </Text>
                  <TouchableOpacity onPress={() => goToJournal()}>
                    <Text style={[fonts.bodySmall, { color: colors.primary, fontWeight: '600' }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text
                    style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 16 }]}
                  >
                    Tap your mood to start today's journal
                  </Text>
                  <MoodSelector selected={null} onSelect={(mood) => goToJournal(mood)} />
                </>
              )}
            </Card>
          </AnimatedCard>

          {/* Today's Insight */}
          <AnimatedCard index={1}>
            <SectionHeader title="Today's Insight" />
            <Card
              style={{
                marginBottom: 20,
                borderLeftWidth: 3,
                borderLeftColor: colors.primary,
              }}
            >
              {currentTip ? (
                <>
                  <View style={styles.tipHeader}>
                    <Ionicons name="bulb" size={20} color={colors.warning} />
                    <Text style={[fonts.heading3, { color: colors.text, flex: 1 }]}>
                      {currentTip.title}
                    </Text>
                  </View>
                  <Text
                    style={[
                      fonts.body,
                      { color: colors.textSecondary, lineHeight: 22, marginTop: 8 },
                    ]}
                  >
                    {currentTip.body}
                  </Text>
                  {currentTip.category && (
                    <View style={[styles.badge, { backgroundColor: `${colors.primaryLight}25` }]}>
                      <Text style={[fonts.caption, { color: colors.primary }]}>
                        {currentTip.category}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={clearTip}
                    style={{ marginTop: 12, alignSelf: 'flex-end' }}
                  >
                    <Text style={[fonts.bodySmall, { color: colors.textSecondary }]}>Dismiss</Text>
                  </TouchableOpacity>
                </>
              ) : quickPrompt ? (
                <>
                  <Text
                    style={[
                      fonts.body,
                      { color: colors.textSecondary, fontStyle: 'italic', lineHeight: 22 },
                    ]}
                  >
                    {quickPrompt.content}
                  </Text>
                  <View style={styles.insightActions}>
                    <TouchableOpacity onPress={() => goToJournal()}>
                      <Text style={[fonts.bodySmall, { color: colors.primary, fontWeight: '600' }]}>
                        Journal this
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => loadDashboard(true)}>
                      <Text style={[fonts.bodySmall, { color: colors.primary, fontWeight: '600' }]}>
                        New insight
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                  <Ionicons name="bulb-outline" size={32} color={colors.textLight} />
                  <Text
                    style={[
                      fonts.bodySmall,
                      { color: colors.textLight, marginTop: 8, textAlign: 'center' },
                    ]}
                  >
                    Enable daily tips in settings to receive wellness insights
                  </Text>
                </View>
              )}
            </Card>
          </AnimatedCard>

          {/* Your Patterns */}
          {insights.length > 0 && (
            <AnimatedCard index={2}>
              <SectionHeader title="Your Patterns" />
              <View style={{ gap: 10, marginBottom: 20 }}>
                {insights.slice(0, 2).map((insight, idx) => (
                  <Card key={`${insight.insightType}-${idx}`}>
                    <View style={styles.insightRow}>
                      <View
                        style={[styles.insightIcon, { backgroundColor: `${colors.primary}12` }]}
                      >
                        <Ionicons
                          name={
                            insight.insightType === 'day_of_week'
                              ? 'calendar-outline'
                              : insight.insightType === 'energy_trend'
                                ? 'trending-up-outline'
                                : insight.insightType === 'mood_streak'
                                  ? 'flame-outline'
                                  : 'heart-outline'
                          }
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[fonts.body, { color: colors.text, fontWeight: '600' }]}>
                          {insight.title}
                        </Text>
                        <Text
                          style={[fonts.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}
                        >
                          {insight.description}
                        </Text>
                        <Text style={[fonts.caption, { color: colors.textLight, marginTop: 4 }]}>
                          Based on {insight.dataPoints}{' '}
                          {insight.dataPoints === 1 ? 'entry' : 'entries'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            </AnimatedCard>
          )}

          {/* Wearable Metrics */}
          {wearable.isEnabled && (
            <AnimatedCard index={insights.length > 0 ? 3 : 2}>
              <SectionHeader title="Today's Health" />
              <WearableMetricsCard
                steps={wearable.data.steps}
                heartRate={wearable.data.heartRate}
                sleepHours={wearable.data.sleepHours}
              />
            </AnimatedCard>
          )}

          {/* Assessment Reminder */}
          {assessmentReminder.show && (
            <AnimatedCard index={insights.length > 0 ? 3 : 2}>
              <Card
                style={{
                  marginBottom: 20,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.accent,
                }}
              >
                <TouchableOpacity
                  style={styles.checkedInRow}
                  onPress={() =>
                    navigation.navigate('Assessment', { assessmentType: assessmentReminder.type })
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons name="clipboard-outline" size={22} color={colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={[fonts.body, { color: colors.text, fontWeight: '600' }]}>
                      Time for a wellness check-in
                    </Text>
                    <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                      {assessmentReminder.daysSince === -1
                        ? `Take your first ${ASSESSMENTS[assessmentReminder.type]?.name} assessment`
                        : `It's been ${assessmentReminder.daysSince} days since your last ${ASSESSMENTS[assessmentReminder.type]?.name}`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                </TouchableOpacity>
              </Card>
            </AnimatedCard>
          )}

          {/* Quick Actions */}
          <AnimatedCard index={(insights.length > 0 ? 3 : 2) + (assessmentReminder.show ? 1 : 0)}>
            <SectionHeader title="Quick Actions" />
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.surface }, cardShadow]}
                onPress={() => goToJournal()}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${colors.secondary}15` }]}>
                  <Ionicons name="journal-outline" size={26} color={colors.secondary} />
                </View>
                <Text style={[fonts.heading3, { color: colors.text, marginTop: 12 }]}>Journal</Text>
                <Text style={[fonts.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                  Write your thoughts
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.surface }, cardShadow]}
                onPress={goToAIChat}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${colors.accent}15` }]}>
                  <Ionicons name="chatbubbles-outline" size={26} color={colors.accent} />
                </View>
                <Text style={[fonts.heading3, { color: colors.text, marginTop: 12 }]}>AI Chat</Text>
                <Text style={[fonts.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                  Talk to Sakina
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.actionsRow, { marginTop: 14 }]}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.surface }, cardShadow]}
                onPress={goToBreathe}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name="leaf-outline" size={26} color={colors.primary} />
                </View>
                <Text style={[fonts.heading3, { color: colors.text, marginTop: 12 }]}>Breathe</Text>
                <Text style={[fonts.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                  Guided breathing
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: colors.surface }, cardShadow]}
                onPress={() => navigation.navigate('AssessmentHistory', { assessmentType: 'PHQ9' })}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${colors.warning}15` }]}>
                  <Ionicons name="clipboard-outline" size={26} color={colors.warning} />
                </View>
                <Text style={[fonts.heading3, { color: colors.text, marginTop: 12 }]}>
                  Check-in
                </Text>
                <Text style={[fonts.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                  Wellbeing score
                </Text>
              </TouchableOpacity>
            </View>
          </AnimatedCard>
        </>
      )}
      </ResponsiveContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  greetingSection: { marginBottom: 28 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  greetingText: { flex: 1 },
  checkedInRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  insightActions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 14,
  },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  actionsRow: { flexDirection: 'row', gap: 14 },
  actionCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
