/**
 * Wave D.3 verification — composes the bento sub-components with fixture data.
 *
 * Mounted at /?homepreview=1 (use &state=loading|loaded|empty|error to switch).
 *
 * Note: this preview composes the SUB-COMPONENTS directly rather than the full
 * HomeScreen, because the real screen depends on hooks (useFocusEffect, the
 * pattern/assessment/wearable hooks, journalApi) that need a real navigator
 * + auth provider. The pieces shown here render exactly what the real screen
 * will show when wired into the app.
 */

import React, { useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useV2Theme } from '../../theme/v2';
import {
  ScreenScaffold,
  Text,
  ErrorState,
  LoadingState,
} from '../../ui/v2';
import { useTheme } from '../../context/ThemeContext';
import { GreetingHero } from './home/GreetingHero';
import { DailyCheckIn } from './home/DailyCheckIn';
import { InsightCard } from './home/InsightCard';
import { PatternsList } from './home/PatternsList';
import { AssessmentReminderCard } from './home/AssessmentReminderCard';
import { QuickActions } from './home/QuickActions';

const STUB_TIP = {
  title: 'A small reset',
  body: 'When the day asks for too much, a single mindful breath is a complete answer.',
  category: 'Mindfulness',
};
const STUB_PROMPT = {
  content: 'What is the smallest kindness you can offer yourself today?',
};
const STUB_INSIGHTS = [
  {
    insightType: 'mood_streak',
    title: '5-day calm streak',
    description: 'You\u2019ve checked in five days running with mostly calm moods.',
    dataPoints: 12,
  },
  {
    insightType: 'energy_trend',
    title: 'Mornings feel brighter',
    description: 'Your energy ratings trend higher before noon than after.',
    dataPoints: 21,
  },
];

function getInitial() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'loaded';
  const params = new URLSearchParams(window.location.search);
  return params.get('state') || 'loaded';
}

const STATES = {
  loading: 'Loading',
  loaded: 'Loaded',
  empty: 'Empty',
  error: 'Error',
};

export function HomePreviewScreen() {
  const v2 = useV2Theme();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [state, setState] = useState(getInitial);

  const isLoading = state === 'loading';
  const isError = state === 'error';
  const insights = state === 'loaded' ? STUB_INSIGHTS : [];
  const tip = state === 'loaded' ? STUB_TIP : null;
  const prompt = state === 'empty' ? null : STUB_PROMPT;
  const showAssessment = state === 'loaded';
  const showWearable = state === 'loaded';

  const noop = () => {};

  return (
    <ScreenScaffold
      ambient
      ambientIntensity="subtle"
      paddingHorizontal={4}
      paddingBottom="safe"
    >
      <GreetingHero
        greeting="Good morning"
        displayName="Aria"
        dateLabel="Wednesday, April 22"
      />

      {isError ? (
        <View style={{ marginTop: v2.spacing[4] }}>
          <ErrorState
            title="Couldn\u2019t load your day"
            body="No internet connection"
            actionLabel="Retry"
            onRetry={noop}
          />
        </View>
      ) : isLoading ? (
        <View style={{ marginTop: v2.spacing[8] }}>
          <LoadingState caption="Tuning into your day" />
        </View>
      ) : (
        <View style={{ gap: v2.spacing[4], marginTop: v2.spacing[6] }}>
          <DailyCheckIn hasCheckedIn={false} onSelectMood={noop} onEdit={noop} />
          <InsightCard
            tip={tip}
            prompt={prompt}
            onJournal={noop}
            onNewInsight={noop}
            onDismissTip={noop}
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
          {showAssessment ? (
            <AssessmentReminderCard
              type="PHQ9"
              daysSince={14}
              assessmentName="PHQ-9"
              onPress={noop}
            />
          ) : null}
          {showWearable ? (
            <View>
              <Text
                variant="label"
                color="secondary"
                style={{ marginBottom: v2.spacing[2], paddingHorizontal: v2.spacing[1] }}
              >
                TODAY’S HEALTH
              </Text>
              <View style={{ flexDirection: 'row', gap: v2.spacing[3] }}>
                {[
                  { label: 'Steps', value: '4,812' },
                  { label: 'Heart rate', value: '68 bpm' },
                  { label: 'Sleep', value: '7.2h' },
                ].map((it) => (
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
                      {it.value}
                    </Text>
                  </View>
                ))}
              </View>
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
            <QuickActions onPress={noop} />
          </View>
        </View>
      )}

      <View style={{ height: v2.spacing[10] }} />

      {/* Floating dev switcher */}
      <View
        pointerEvents="box-none"
        style={{ position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'center' }}
      >
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            backgroundColor: v2.palette.bg.elevated,
            borderColor: v2.palette.border.subtle,
            borderWidth: 1,
            borderRadius: v2.radius.full,
            paddingHorizontal: 6,
            paddingVertical: 4,
          }}
        >
          {Object.entries(STATES).map(([key, label]) => {
            const active = key === state;
            return (
              <Pressable
                key={key}
                onPress={() => setState(key)}
                accessibilityRole="button"
                accessibilityLabel={`Show ${label} state`}
                accessibilityState={{ selected: active }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: active ? v2.palette.primary : 'transparent',
                }}
              >
                <Text
                  variant="label"
                  style={{
                    color: active ? v2.palette.text.onPrimary : v2.palette.text.secondary,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={toggleDarkMode}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: v2.palette.bg.surface,
            }}
          >
            <Text variant="label">{isDarkMode ? 'DARK' : 'LIGHT'}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenScaffold>
  );
}

export default HomePreviewScreen;
