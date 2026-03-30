import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BreathingCircle } from '../components/BreathingCircle';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { BREATHING_PATTERNS, getCycleMs, getDefaultPattern } from '../constants/breathingPatterns';

const DEFAULT_CYCLES = 5;

function PatternChip({ pattern, isSelected, onPress, colors, fonts }) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? `${colors.primary}18` : colors.background,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          fonts.bodySmall,
          {
            color: isSelected ? colors.primary : colors.textSecondary,
            fontWeight: isSelected ? '600' : '400',
          },
        ]}
      >
        {pattern.label}
      </Text>
    </TouchableOpacity>
  );
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function BreathingExerciseScreen({ navigation, route }) {
  const { colors, fonts } = useTheme();
  const initialPatternId = route?.params?.patternId ?? null;

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

  // Elapsed time counter
  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => {
        setElapsedMs((prev) => prev + 1000);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleCycleComplete = useCallback(() => {
    setCompletedCycles((prev) => prev + 1);
  }, []);

  const handleSessionComplete = useCallback(() => {
    setPhase('complete');
  }, []);

  const startSession = useCallback(() => {
    setCompletedCycles(0);
    setElapsedMs(0);
    setPhase('active');
  }, []);

  const pauseSession = useCallback(() => {
    setPhase('paused');
  }, []);

  const stopSession = useCallback(() => {
    setPhase('complete');
  }, []);

  const resetSession = useCallback(() => {
    setCompletedCycles(0);
    setElapsedMs(0);
    setPhase('setup');
  }, []);

  const selectPattern = useCallback((pattern) => {
    setSelectedPattern(pattern);
  }, []);

  // === Setup view ===
  if (phase === 'setup') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.setupContent}>
          <Text style={[fonts.heading1, { color: colors.text, textAlign: 'center' }]}>
            Breathing Exercise
          </Text>
          <Text
            style={[fonts.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}
          >
            Choose a pattern and find your calm
          </Text>

          {/* Pattern selector */}
          <View style={styles.patternList}>
            {BREATHING_PATTERNS.map((pattern) => (
              <PatternChip
                key={pattern.id}
                pattern={pattern}
                isSelected={selectedPattern.id === pattern.id}
                onPress={() => selectPattern(pattern)}
                colors={colors}
                fonts={fonts}
              />
            ))}
          </View>

          {/* Selected pattern details */}
          <Card style={styles.detailCard}>
            <Text style={[fonts.heading3, { color: colors.text }]}>{selectedPattern.label}</Text>
            <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
              {selectedPattern.description}
            </Text>

            <View style={styles.timingRow}>
              <TimingBadge
                label="In"
                seconds={selectedPattern.inhaleMs / 1000}
                colors={colors}
                fonts={fonts}
              />
              <TimingBadge
                label="Hold"
                seconds={selectedPattern.holdMs / 1000}
                colors={colors}
                fonts={fonts}
              />
              <TimingBadge
                label="Out"
                seconds={selectedPattern.exhaleMs / 1000}
                colors={colors}
                fonts={fonts}
              />
              {selectedPattern.hold2Ms > 0 && (
                <TimingBadge
                  label="Hold"
                  seconds={selectedPattern.hold2Ms / 1000}
                  colors={colors}
                  fonts={fonts}
                />
              )}
            </View>

            <Text
              style={[
                fonts.caption,
                { color: colors.textLight, marginTop: 12, textAlign: 'center' },
              ]}
            >
              {DEFAULT_CYCLES} cycles ~ {estimateLabel}
            </Text>
          </Card>

          <Button title="Begin" onPress={startSession} style={{ width: '100%', marginTop: 24 }} />
        </View>
      </View>
    );
  }

  // === Complete view ===
  if (phase === 'complete') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.completeContent}>
          <View style={[styles.completeIcon, { backgroundColor: `${colors.success}20` }]}>
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
          </View>

          <Text
            style={[fonts.heading1, { color: colors.text, textAlign: 'center', marginTop: 24 }]}
          >
            Well done
          </Text>
          <Text
            style={[
              fonts.body,
              { color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
            ]}
          >
            You completed {completedCycles} {completedCycles === 1 ? 'cycle' : 'cycles'} of{' '}
            {selectedPattern.label} breathing.
          </Text>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[fonts.metric, { color: colors.primary }]}>{completedCycles}</Text>
              <Text style={[fonts.caption, { color: colors.textSecondary }]}>Cycles</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[fonts.metric, { color: colors.primary }]}>{formatTime(elapsedMs)}</Text>
              <Text style={[fonts.caption, { color: colors.textSecondary }]}>Duration</Text>
            </View>
          </View>

          <Button
            title="Done"
            onPress={() => navigation.goBack()}
            style={{ width: '100%', marginTop: 32 }}
          />
          <Button
            variant="ghost"
            title="Try Another Pattern"
            onPress={resetSession}
            style={{ width: '100%', marginTop: 8 }}
          />
        </Animated.View>
      </View>
    );
  }

  // === Active / Paused view ===
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.activeContent}>
        {/* Cycle counter */}
        <Text style={[fonts.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
          Cycle {Math.min(completedCycles + 1, DEFAULT_CYCLES)} of {DEFAULT_CYCLES}
        </Text>

        {/* Breathing circle */}
        <View style={styles.circleWrap}>
          <BreathingCircle
            key={`${selectedPattern.id}-${phase}`}
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

        {/* Elapsed time */}
        <Text
          style={[fonts.bodySmall, { color: colors.textLight, textAlign: 'center', marginTop: 16 }]}
        >
          {formatTime(elapsedMs)}
        </Text>

        {/* Controls */}
        <View style={styles.controlRow}>
          {phase === 'active' ? (
            <TouchableOpacity
              style={[
                styles.controlBtn,
                { backgroundColor: `${colors.warning}20`, borderColor: colors.warning },
              ]}
              onPress={pauseSession}
            >
              <Ionicons name="pause" size={24} color={colors.warning} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.controlBtn,
                { backgroundColor: `${colors.primary}20`, borderColor: colors.primary },
              ]}
              onPress={() => setPhase('active')}
            >
              <Ionicons name="play" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.controlBtn,
              { backgroundColor: `${colors.error}15`, borderColor: colors.error },
            ]}
            onPress={stopSession}
          >
            <Ionicons name="stop" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function TimingBadge({ label, seconds, colors, fonts }) {
  return (
    <View style={[styles.timingBadge, { backgroundColor: `${colors.primary}12` }]}>
      <Text style={[fonts.caption, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[fonts.heading3, { color: colors.primary }]}>{seconds}s</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  setupContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternList: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  detailCard: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  timingRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  timingBadge: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 56,
  },
  activeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleWrap: {
    marginTop: 24,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 32,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 28,
  },
  statItem: {
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
});
