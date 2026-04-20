/**
 * Wave D.6 verification — previews breathing setup + assessment surfaces.
 * Mounted at /?breathassesspreview=1&screen=breathing|assessment|result|history
 *
 * Note: previews static surfaces — the real BreathingExerciseScreen mounts
 * BreathingCircle (animated state machine) and AssessmentHistory uses
 * useFocusEffect, both require the full provider/navigation tree.
 */

import React, { useState, useMemo } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useV2Theme } from '../../theme/v2';
import { useTheme } from '../../context/ThemeContext';
import { ToastProvider } from '../../context/ToastContext';
import {
  Button,
  Card,
  Chip,
  IconButton,
  ProgressRing,
  ScreenHeader,
  ScreenScaffold,
  Surface,
  Text,
} from '../../ui/v2';
import {
  Play,
  Pause,
  StopCircle,
  Info,
  ClipboardText,
  TrendDown,
  CheckCircle,
  ClockClockwise,
  Check,
  ArrowRight,
} from 'phosphor-react-native';
import { BREATHING_PATTERNS, getDefaultPattern } from '../../constants/breathingPatterns';
import { ASSESSMENTS, RESPONSE_OPTIONS, CLINICAL_DISCLAIMER } from '../../constants/assessments';
import { severityColor } from './assessment/severity';

const SCREENS = {
  breathing: 'Setup',
  active: 'Breathe',
  assessment: 'Quiz',
  result: 'Result',
  history: 'History',
};

function getInitial() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'breathing';
  const params = new URLSearchParams(window.location.search);
  return params.get('screen') || 'breathing';
}

export function BreathAssessPreviewScreen() {
  const v2 = useV2Theme();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [screen, setScreen] = useState(getInitial);

  return (
    <ToastProvider>
      <View style={{ flex: 1, backgroundColor: v2.palette.bg.base }}>
        {screen === 'breathing' ? <BreathingSetupPreview v2={v2} /> : null}
        {screen === 'active' ? <BreathingActivePreview v2={v2} /> : null}
        {screen === 'assessment' ? <AssessmentPreview v2={v2} /> : null}
        {screen === 'result' ? <ResultPreview v2={v2} /> : null}
        {screen === 'history' ? <HistoryPreview v2={v2} /> : null}

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
            {Object.entries(SCREENS).map(([k, label]) => {
              const active = k === screen;
              return (
                <Pressable
                  key={k}
                  onPress={() => setScreen(k)}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${label}`}
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
      </View>
    </ToastProvider>
  );
}

function BreathingSetupPreview({ v2 }) {
  const [pattern, setPattern] = useState(getDefaultPattern());
  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingHorizontal={6}>
      <ScreenHeader />
      <View style={{ alignItems: 'center', marginTop: v2.spacing[6] }}>
        <Text variant="display-lg" align="center">Breathe</Text>
        <Text
          variant="body"
          color="secondary"
          align="center"
          style={{ marginTop: v2.spacing[2], maxWidth: 320 }}
        >
          Choose a pattern and find your calm.
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: v2.spacing[2],
          marginTop: v2.spacing[8],
        }}
      >
        {BREATHING_PATTERNS.map((p) => (
          <Chip key={p.id} selected={pattern.id === p.id} onPress={() => setPattern(p)}>
            {p.label}
          </Chip>
        ))}
      </View>
      <Card padding={5} style={{ marginTop: v2.spacing[6] }}>
        <Text variant="h2" align="center">{pattern.label}</Text>
        <Text variant="body-sm" color="secondary" align="center" style={{ marginTop: v2.spacing[2] }}>
          {pattern.description}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            gap: v2.spacing[2],
            marginTop: v2.spacing[4],
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {[
            { label: 'In', s: pattern.inhaleMs / 1000 },
            { label: 'Hold', s: pattern.holdMs / 1000 },
            { label: 'Out', s: pattern.exhaleMs / 1000 },
            ...(pattern.hold2Ms > 0 ? [{ label: 'Hold', s: pattern.hold2Ms / 1000 }] : []),
          ].map((b, i) => (
            <View
              key={`${b.label}-${i}`}
              style={{
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: v2.radius.md,
                backgroundColor: v2.palette.bg.surfaceHigh,
                minWidth: 64,
              }}
            >
              <Text variant="caption" color="tertiary">{b.label}</Text>
              <Text variant="h3" style={{ color: v2.palette.primary, marginTop: 2 }}>
                {b.s}s
              </Text>
            </View>
          ))}
        </View>
      </Card>
      <View style={{ marginTop: v2.spacing[6] }}>
        <Button variant="primary" size="lg" fullWidth>
          Begin
        </Button>
      </View>
    </ScreenScaffold>
  );
}

function BreathingActivePreview({ v2 }) {
  return (
    <ScreenScaffold ambient ambientIntensity="vivid" paddingHorizontal={6} scrollable={false}>
      <ScreenHeader
        right={
          <Text variant="caption" color="secondary">Cycle 3 of 5</Text>
        }
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}>
          <ProgressRing progress={0.6} size={280} strokeWidth={2} />
          <View
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: v2.palette.accent,
              opacity: 0.85,
            }}
          />
        </View>
        <Text variant="mono" color="tertiary" style={{ marginTop: v2.spacing[6] }}>
          1:24
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: v2.spacing[5],
          justifyContent: 'center',
          paddingBottom: v2.spacing[6],
        }}
      >
        <IconButton icon={Pause} accessibilityLabel="Pause" variant="solid" size="lg" />
        <IconButton icon={StopCircle} accessibilityLabel="Stop" variant="solid" size="lg" weight="fill" />
      </View>
    </ScreenScaffold>
  );
}

function AssessmentPreview({ v2 }) {
  const assessment = ASSESSMENTS.PHQ9;
  const progress = 3 / assessment.questions.length;
  const [selected, setSelected] = useState(2);
  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingHorizontal={6}>
      <ScreenHeader
        onBack={() => {}}
        right={<ProgressRing progress={progress} size={40} strokeWidth={2} />}
      />
      <View style={{ marginTop: v2.spacing[2], marginBottom: v2.spacing[6] }}>
        <Text variant="display-lg">{assessment.name}</Text>
        <Text variant="body" color="secondary" style={{ marginTop: v2.spacing[2], maxWidth: 360 }}>
          {assessment.timeframe}, how often have you been bothered by:
        </Text>
        <Text variant="caption" color="tertiary" style={{ marginTop: v2.spacing[3] }}>
          QUESTION 3 OF {assessment.questions.length}
        </Text>
      </View>

      <Card padding={5}>
        <Text variant="h2">{assessment.questions[2]}</Text>
        <View style={{ gap: v2.spacing[2], marginTop: v2.spacing[5] }}>
          {RESPONSE_OPTIONS.map((option) => {
            const isSelected = selected === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                onPress={() => setSelected(option.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: v2.spacing[3],
                  padding: v2.spacing[4],
                  borderRadius: v2.radius.lg,
                  borderWidth: 1,
                  borderColor: isSelected ? v2.palette.primary : v2.palette.border.subtle,
                  backgroundColor: isSelected ? v2.palette.bg.surfaceHigh : v2.palette.bg.surface,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isSelected ? v2.palette.primary : v2.palette.border.strong,
                    backgroundColor: isSelected ? v2.palette.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected ? <Check size={14} color={v2.palette.text.onPrimary} weight="bold" /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="body"
                    style={{
                      color: isSelected ? v2.palette.primary : v2.palette.text.primary,
                      fontFamily: isSelected ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                    }}
                  >
                    {option.label}
                  </Text>
                  <Text variant="caption" color="tertiary" style={{ marginTop: 2 }}>
                    {option.value} {option.value === 1 ? 'point' : 'points'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: v2.spacing[2],
          marginTop: v2.spacing[6],
        }}
      >
        <Button variant="secondary">Back</Button>
        <View style={{ flex: 1 }} />
        <Button variant="primary" trailingIcon={ArrowRight}>Next</Button>
      </View>

      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginTop: v2.spacing[6],
          flexDirection: 'row',
          gap: v2.spacing[2],
          alignItems: 'flex-start',
        }}
      >
        <Info size={18} color={v2.palette.text.tertiary} weight="duotone" />
        <Text variant="body-sm" color="tertiary" style={{ flex: 1 }}>
          {CLINICAL_DISCLAIMER}
        </Text>
      </Surface>
    </ScreenScaffold>
  );
}

function ResultPreview({ v2 }) {
  const assessment = ASSESSMENTS.PHQ9;
  const result = { totalScore: 7, severity: 'mild', severityLabel: 'Mild' };
  const progress = result.totalScore / assessment.maxScore;
  const color = severityColor(v2.palette, result.severity);
  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingHorizontal={6}>
      <Card padding={5} style={{ marginTop: v2.spacing[2], alignItems: 'center' }}>
        <Text variant="display-lg" align="center">{assessment.name} results</Text>
        <Text variant="body-sm" color="secondary" align="center" style={{ marginTop: v2.spacing[1] }}>
          {assessment.fullName}
        </Text>
        <View
          style={{
            width: 200,
            height: 200,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: v2.spacing[6],
          }}
        >
          <ProgressRing progress={progress} size={200} strokeWidth={3} color={color} />
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Text variant="display-lg" style={{ color }}>{result.totalScore}</Text>
            <Text variant="caption" color="tertiary">of {assessment.maxScore}</Text>
          </View>
        </View>
        <View
          style={{
            marginTop: v2.spacing[5],
            paddingHorizontal: v2.spacing[5],
            paddingVertical: v2.spacing[2],
            borderRadius: v2.radius.full,
            backgroundColor: v2.palette.bg.surfaceHigh,
            borderWidth: 1,
            borderColor: color,
            flexDirection: 'row',
            alignItems: 'center',
            gap: v2.spacing[2],
          }}
        >
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
          <Text variant="h3" style={{ color }}>{result.severityLabel}</Text>
        </View>
      </Card>
      <Card padding={4} style={{ marginTop: v2.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Info size={20} color={v2.palette.accent} weight="duotone" />
          <Text variant="h3">What this means</Text>
        </View>
        <Text variant="body" color="secondary" style={{ marginTop: v2.spacing[2] }}>
          Your responses suggest mild symptoms. Consider continuing to monitor how you feel and
          practicing wellness techniques.
        </Text>
      </Card>
      <View style={{ gap: v2.spacing[2], marginTop: v2.spacing[5] }}>
        <Button variant="secondary" size="lg" fullWidth leadingIcon={ClockClockwise}>
          View history
        </Button>
        <Button variant="primary" size="lg" fullWidth leadingIcon={CheckCircle}>
          Done
        </Button>
      </View>
    </ScreenScaffold>
  );
}

function HistoryPreview({ v2 }) {
  const items = [
    { id: 1, totalScore: 7, severity: 'mild', severityLabel: 'Mild', completedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 2, totalScore: 12, severity: 'moderate', severityLabel: 'Moderate', completedAt: new Date(Date.now() - 9 * 86400000).toISOString() },
    { id: 3, totalScore: 15, severity: 'moderately_severe', severityLabel: 'Moderately severe', completedAt: new Date(Date.now() - 16 * 86400000).toISOString() },
    { id: 4, totalScore: 4, severity: 'minimal', severityLabel: 'Minimal', completedAt: new Date(Date.now() - 23 * 86400000).toISOString() },
  ];
  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingHorizontal={4}>
      <ScreenHeader title="Assessments" onBack={() => {}} />
      <View style={{ flexDirection: 'row', gap: v2.spacing[2], marginTop: v2.spacing[2] }}>
        <Chip selected onPress={() => {}}>Depression (PHQ-9)</Chip>
        <Chip selected={false} onPress={() => {}}>Anxiety (GAD-7)</Chip>
      </View>

      <Card padding={4} style={{ marginTop: v2.spacing[4] }}>
        <Text variant="h3">Your progress</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            marginTop: v2.spacing[3],
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Text variant="caption" color="tertiary">First</Text>
            <Text variant="display-lg" style={{ marginTop: 2 }}>15</Text>
            <Text variant="caption" color="tertiary">Mod. severe</Text>
          </View>
          <TrendDown size={28} color={v2.palette.success} weight="duotone" />
          <View style={{ alignItems: 'center' }}>
            <Text variant="caption" color="tertiary">Latest</Text>
            <Text variant="display-lg" style={{ marginTop: 2 }}>7</Text>
            <Text variant="caption" color="tertiary">Mild</Text>
          </View>
        </View>
        <Text
          variant="body-sm"
          align="center"
          style={{ color: v2.palette.success, marginTop: v2.spacing[2] }}
        >
          -8 points · improving
        </Text>
      </Card>

      <View style={{ marginTop: v2.spacing[4], gap: v2.spacing[2] }}>
        {items.map((item) => {
          const dot = severityColor(v2.palette, item.severity);
          return (
            <Card key={item.id} padding={4}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[3] }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: dot }} />
                <View style={{ flex: 1 }}>
                  <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }}>
                    Score: {item.totalScore} / 27
                  </Text>
                  <Text variant="body-sm" style={{ color: dot, marginTop: 2 }}>
                    {item.severityLabel}
                  </Text>
                </View>
                <Text variant="caption" color="tertiary">
                  {new Date(item.completedAt).toLocaleDateString()}
                </Text>
              </View>
            </Card>
          );
        })}
      </View>

      <View style={{ marginTop: v2.spacing[4] }}>
        <Button variant="primary" size="lg" fullWidth leadingIcon={ClipboardText}>
          Take PHQ-9 assessment
        </Button>
      </View>
    </ScreenScaffold>
  );
}

export default BreathAssessPreviewScreen;
