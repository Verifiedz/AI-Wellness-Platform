/**
 * HomeScreen v2 — bento dashboard.
 *
 * Composes GreetingHero + DailyCheckIn + InsightCard + PatternsList +
 * AssessmentReminderCard + QuickActions inside a ScreenScaffold with
 * ambient aurora and a refreshable scroller.
 *
 * Behavior preserved end-to-end:
 *   - useFocusEffect-based load with hasLoadedRef "first vs soft refresh" logic
 *   - 404 on today's entry is not an error (user just hasn't journaled)
 *   - All navigation targets (Journal, Sakina chat, BreathingExercise,
 *     Assessment, AssessmentHistory) match the legacy screen exactly
 *   - currentTip / clearTip / quickPrompt swap logic unchanged
 *   - usePatternInsights, useAssessmentReminder, useWearableData hooks intact
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format, subDays } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';
import { useTip } from '../../../context/TipContext';
import { journalApi } from '../../../services/journalApi';
import { usePatternInsights } from '../../../hooks/usePatternInsights';
import { useAssessmentReminder } from '../../../hooks/useAssessmentReminder';
import { useWearableData } from '../../../hooks/useWearableData';
import { ASSESSMENTS } from '../../../constants/assessments';
import { useV2Theme } from '../../../theme/v2';
import {
  ScreenScaffold,
  Stagger,
  Text,
  ErrorState,
  LoadingState,
} from '../../../ui/v2';
import { GreetingHero } from './GreetingHero';
import { DailyCheckIn } from './DailyCheckIn';
import { InsightCard } from './InsightCard';
import { PatternsList } from './PatternsList';
import { AssessmentReminderCard } from './AssessmentReminderCard';
import { QuickActions } from './QuickActions';

function getDisplayName(user) {
  if (user?.username?.trim()) return user.username.trim();
  if (user?.email?.includes('@')) return user.email.split('@')[0];
  return 'there';
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// kept in case downstream date-range logic returns
// eslint-disable-next-line no-unused-vars
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
  const v2 = useV2Theme();

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

      const entryError =
        todayEntryResult.error && todayEntryResult.status !== 404
          ? todayEntryResult.error
          : null;
      const promptError =
        promptResult.error && promptResult.status !== 404 ? promptResult.error : null;
      const firstError = entryError || promptError;

      setError(firstError || null);
      setTodayEntry(todayEntryResult.data || null);
      setQuickPrompt(promptResult.data || null);
    } catch (err) {
      const isNetwork =
        err instanceof TypeError ||
        (err.message && err.message.toLowerCase().includes('network'));
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

  const handleQuickAction = useCallback(
    (id) => {
      switch (id) {
        case 'journal':
          goToJournal();
          break;
        case 'chat':
          goToAIChat();
          break;
        case 'breathe':
          goToBreathe();
          break;
        case 'checkin':
          navigation.navigate('AssessmentHistory', { assessmentType: 'PHQ9' });
          break;
        default:
          break;
      }
    },
    [goToJournal, goToAIChat, goToBreathe, navigation]
  );

  const handleAssessmentReminder = useCallback(() => {
    navigation.navigate('Assessment', { assessmentType: assessmentReminder.type });
  }, [navigation, assessmentReminder.type]);

  return (
    <ScreenScaffold
      ambient
      ambientIntensity="subtle"
      paddingHorizontal={4}
      paddingBottom="tabBar"
      refreshControl={{
        refreshing: isRefreshing,
        onRefresh: () => {
          loadDashboard(true);
          refreshInsights();
        },
      }}
    >
      <GreetingHero greeting={greeting} displayName={displayName} dateLabel={todayDate} />

      {error ? (
        <View style={{ marginTop: v2.spacing[4] }}>
          <ErrorState
            title="Couldn't load your day"
            body={error}
            actionLabel="Retry"
            onRetry={() => {
              setError(null);
              loadDashboard(true);
              refreshInsights();
            }}
          />
        </View>
      ) : null}

      {isInitialLoading ? (
        <View style={{ marginTop: v2.spacing[8] }}>
          <LoadingState caption="Tuning into your day" />
        </View>
      ) : (
        <View style={{ gap: v2.spacing[4], marginTop: v2.spacing[6] }}>
          <Stagger>
          <DailyCheckIn
            hasCheckedIn={!!todayEntry}
            onSelectMood={(mood) => goToJournal(mood)}
            onEdit={() => goToJournal()}
          />

          <InsightCard
            tip={currentTip}
            prompt={quickPrompt}
            onJournal={() => goToJournal()}
            onNewInsight={() => loadDashboard(true)}
            onDismissTip={clearTip}
          />

          {insights.length > 0 ? (
            <View>
              <Text
                variant="label"
                color="secondary"
                style={{ marginBottom: v2.spacing[2], paddingHorizontal: v2.spacing[1] }}
              >
                YOUR PATTERNS
              </Text>
              <PatternsList insights={insights} />
            </View>
          ) : null}

          {assessmentReminder.show ? (
            <AssessmentReminderCard
              type={assessmentReminder.type}
              daysSince={assessmentReminder.daysSince}
              assessmentName={ASSESSMENTS[assessmentReminder.type]?.name ?? 'check-in'}
              onPress={handleAssessmentReminder}
            />
          ) : null}

          {wearable.isEnabled ? (
            <View>
              <Text
                variant="label"
                color="secondary"
                style={{ marginBottom: v2.spacing[2], paddingHorizontal: v2.spacing[1] }}
              >
                TODAY’S HEALTH
              </Text>
              <WearableSummary data={wearable.data} />
            </View>
          ) : null}

          <View>
            <Text
              variant="label"
              color="secondary"
              style={{ marginBottom: v2.spacing[2], paddingHorizontal: v2.spacing[1] }}
            >
              QUICK ACTIONS
            </Text>
            <QuickActions onPress={handleQuickAction} />
          </View>
          </Stagger>
        </View>
      )}
    </ScreenScaffold>
  );
}

// Lightweight inline wearable summary — wraps the legacy data in v2 cards.
function WearableSummary({ data }) {
  const v2 = useV2Theme();
  const items = [
    { label: 'Steps', value: data?.steps ?? '\u2014' },
    { label: 'Heart rate', value: data?.heartRate ? `${data.heartRate} bpm` : '\u2014' },
    { label: 'Sleep', value: data?.sleepHours ? `${data.sleepHours}h` : '\u2014' },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: v2.spacing[3] }}>
      {items.map((it) => (
        <View
          key={it.label}
          style={{
            flex: 1,
            padding: v2.spacing[4],
            borderRadius: v2.radius.lg,
            backgroundColor: v2.palette.bg.surface,
            borderWidth: 1,
            borderColor: v2.palette.border.subtle,
          }}
        >
          <Text variant="caption" color="tertiary">
            {it.label}
          </Text>
          <Text variant="h2" style={{ marginTop: 4 }}>
            {String(it.value)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default HomeScreen;
