/**
 * BreathingExerciseScreen v2 — three-phase guided breathing.
 *
 * Phases (preserved from legacy): setup → active/paused → complete.
 *
 * Behavior preserved end-to-end:
 *   - BREATHING_PATTERNS / getCycleMs / getDefaultPattern from constants
 *   - DEFAULT_CYCLES = 5
 *   - elapsedMs tracked while phase==='active'
 *   - completedCycles increments per cycle, navigation.goBack() on Done
 *   - route.params.patternId selects initial pattern when present
 *
 * Visual rewrite:
 *   - Vivid AuroraBackground while active so the whole screen feels alive
 *   - Skia-driven breathing orb (existing BreathingCircle reused — already
 *     handles the inhale/hold/exhale state machine and onCycleComplete)
 *   - ProgressRing wraps the orb to show cycle progress
 *   - ParticleBloom on completion + success haptic
 *   - Phosphor controls (Play / Pause / Stop)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { Play, Pause, StopCircle, CheckCircle } from 'phosphor-react-native';
import { BreathingCircle } from '../../../components/BreathingCircle';
import {
  BREATHING_PATTERNS,
  getCycleMs,
  getDefaultPattern,
} from '../../../constants/breathingPatterns';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Card,
  Chip,
  IconButton,
  ScreenScaffold,
  ScreenHeader,
  Text,
  ProgressRing,
  ParticleBloom,
  useHaptic,
} from '../../../ui/v2';

const DEFAULT_CYCLES = 5;

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function BreathingExerciseScreen({ navigation, route }) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();
  const initialPatternId = route?.params?.patternId ?? null;
  const bloomRef = useRef(null);

  const [selectedPattern, setSelectedPattern] = useState(() => {
    if (initialPatternId) {
      return BREATHING_PATTERNS.find((p) => p.id === initialPatternId) || getDefaultPattern();
    }
    return getDefaultPattern();
  });

  const [phase, setPhase] = useState('setup'); // setup | active | paused | complete
  const [completedCycles, setCompletedCycles] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef(null);

  const cycleMs = useMemo(() => getCycleMs(selectedPattern), [selectedPattern]);
  const totalMs = useMemo(() => cycleMs * DEFAULT_CYCLES, [cycleMs]);
  const estimateLabel = useMemo(() => {
    const seconds = Math.round(totalMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    if (minutes === 0) return `${seconds}s`;
    if (remainder === 0) return `${minutes} min`;
    return `${minutes} min ${remainder}s`;
  }, [totalMs]);

  // Elapsed timer
  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => {
        setElapsedMs((prev) => prev + 1000);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  const handleCycleComplete = useCallback(() => {
    fireHaptic('soft');
    setCompletedCycles((prev) => prev + 1);
  }, [fireHaptic]);

  const handleSessionComplete = useCallback(() => {
    setPhase('complete');
    bloomRef.current?.bloom({ x: 207, y: 380, count: 24 });
  }, []);

  const startSession = useCallback(() => {
    setCompletedCycles(0);
    setElapsedMs(0);
    setPhase('active');
  }, []);

  const resumeSession = useCallback(() => setPhase('active'), []);
  const pauseSession = useCallback(() => setPhase('paused'), []);
  const stopSession = useCallback(() => {
    setPhase('complete');
    bloomRef.current?.bloom({ x: 207, y: 380, count: 16 });
  }, []);
  const resetSession = useCallback(() => {
    setCompletedCycles(0);
    setElapsedMs(0);
    setPhase('setup');
  }, []);

  // === Setup view ===
  if (phase === 'setup') {
    return (
      <ScreenScaffold ambient ambientIntensity="subtle" paddingHorizontal={6} scrollable={false}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        {/* Center the setup content vertically so it doesn't hug the top of
            the viewport on tall screens. */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <Text variant="display-lg" align="center">
              Breathe
            </Text>
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
              marginTop: v2.spacing[6],
            }}
          >
            {BREATHING_PATTERNS.map((pattern) => (
              <Chip
                key={pattern.id}
                selected={selectedPattern.id === pattern.id}
                onPress={() => setSelectedPattern(pattern)}
                accessibilityLabel={`Pattern: ${pattern.label}`}
              >
                {pattern.label}
              </Chip>
            ))}
          </View>

          <Card padding={5} style={{ marginTop: v2.spacing[5] }}>
            <Text variant="h2" align="center">
              {selectedPattern.label}
            </Text>
            <Text
              variant="body-sm"
              color="secondary"
              align="center"
              style={{ marginTop: v2.spacing[2] }}
            >
              {selectedPattern.description}
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
              <TimingBadge label="In" seconds={selectedPattern.inhaleMs / 1000} v2={v2} />
              <TimingBadge label="Hold" seconds={selectedPattern.holdMs / 1000} v2={v2} />
              <TimingBadge label="Out" seconds={selectedPattern.exhaleMs / 1000} v2={v2} />
              {selectedPattern.hold2Ms > 0 ? (
                <TimingBadge label="Hold" seconds={selectedPattern.hold2Ms / 1000} v2={v2} />
              ) : null}
            </View>
            <Text
              variant="caption"
              color="tertiary"
              align="center"
              style={{ marginTop: v2.spacing[3] }}
            >
              {DEFAULT_CYCLES} cycles · ~{estimateLabel}
            </Text>
          </Card>
        </View>

        <View style={{ paddingBottom: v2.spacing[4] }}>
          <Button variant="primary" size="lg" fullWidth onPress={startSession}>
            Begin
          </Button>
        </View>
      </ScreenScaffold>
    );
  }

  // === Complete view ===
  if (phase === 'complete') {
    return (
      <ScreenScaffold ambient ambientIntensity="vivid" paddingHorizontal={6}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <MotiView
            from={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200 }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: v2.palette.bg.surfaceHigh,
              borderWidth: 1,
              borderColor: v2.palette.success,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle size={56} color={v2.palette.success} weight="duotone" />
          </MotiView>
          <Text variant="display-lg" align="center" style={{ marginTop: v2.spacing[6] }}>
            Well done.
          </Text>
          <Text
            variant="body-lg"
            color="secondary"
            align="center"
            style={{ marginTop: v2.spacing[2], maxWidth: 320 }}
          >
            You completed {completedCycles}{' '}
            {completedCycles === 1 ? 'cycle' : 'cycles'} of {selectedPattern.label}.
          </Text>

          <View
            style={{
              flexDirection: 'row',
              gap: v2.spacing[8],
              marginTop: v2.spacing[8],
              alignItems: 'center',
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text variant="display-lg">{completedCycles}</Text>
              <Text variant="caption" color="tertiary">
                Cycles
              </Text>
            </View>
            <View
              style={{
                width: 1,
                height: 40,
                backgroundColor: v2.palette.border.subtle,
              }}
            />
            <View style={{ alignItems: 'center' }}>
              <Text variant="display-lg">{formatTime(elapsedMs)}</Text>
              <Text variant="caption" color="tertiary">
                Duration
              </Text>
            </View>
          </View>
        </View>

        <View style={{ gap: v2.spacing[3], paddingTop: v2.spacing[8], paddingBottom: v2.spacing[6] }}>
          <Button variant="primary" size="lg" fullWidth onPress={() => navigation.goBack()}>
            Done
          </Button>
          <Button variant="ghost" size="md" fullWidth onPress={resetSession}>
            Try another pattern
          </Button>
        </View>
        <ParticleBloom ref={bloomRef} />
      </ScreenScaffold>
    );
  }

  // === Active / Paused view ===
  const cycleProgress = Math.min(1, completedCycles / DEFAULT_CYCLES);

  return (
    <ScreenScaffold ambient ambientIntensity="vivid" paddingHorizontal={6} scrollable={false}>
      <ScreenHeader
        right={
          <Text variant="caption" color="secondary">
            Cycle {Math.min(completedCycles + 1, DEFAULT_CYCLES)} of {DEFAULT_CYCLES}
          </Text>
        }
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 280,
            height: 280,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ProgressRing progress={cycleProgress} size={280} strokeWidth={2} />
          {/* Center the orb inside the ring. The legacy BreathingCircle
              renders a column (circle + phase text below with marginTop),
              so we center it with flex — the orb lands dead-center on the
              ring, and the phase label sits below the ring but still
              inside the 280 box. No overflow clipping (that was causing
              the orb to disappear behind a visible square when the
              scale-up animation pushed it against the clip bounds). */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            pointerEvents="none"
          >
            <BreathingCircle
              key={selectedPattern.id}
              size={220}
              autoStart={phase === 'active'}
              inhaleMs={selectedPattern.inhaleMs}
              holdMs={selectedPattern.holdMs}
              exhaleMs={selectedPattern.exhaleMs}
              hold2Ms={selectedPattern.hold2Ms}
              cycles={DEFAULT_CYCLES - completedCycles}
              isPaused={phase === 'paused'}
              onCycleComplete={handleCycleComplete}
              onSessionComplete={handleSessionComplete}
            />
          </View>
        </View>

        <Text
          variant="mono"
          color="tertiary"
          style={{ marginTop: v2.spacing[8] }}
        >
          {formatTime(elapsedMs)}
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
        {phase === 'active' ? (
          <IconButton
            icon={Pause}
            accessibilityLabel="Pause"
            variant="solid"
            size="lg"
            onPress={pauseSession}
          />
        ) : (
          <IconButton
            icon={Play}
            accessibilityLabel="Resume"
            variant="accent"
            size="lg"
            weight="fill"
            onPress={resumeSession}
          />
        )}
        <IconButton
          icon={StopCircle}
          accessibilityLabel="Stop"
          variant="solid"
          size="lg"
          weight="fill"
          haptic="warn"
          onPress={stopSession}
        />
      </View>
    </ScreenScaffold>
  );
}

function TimingBadge({ label, seconds, v2 }) {
  return (
    <View
      style={{
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: v2.radius.md,
        backgroundColor: v2.palette.bg.surfaceHigh,
        minWidth: 64,
      }}
    >
      <Text variant="caption" color="tertiary">
        {label}
      </Text>
      <Text variant="h3" style={{ color: v2.palette.primary, marginTop: 2 }}>
        {seconds}s
      </Text>
    </View>
  );
}

export default BreathingExerciseScreen;
