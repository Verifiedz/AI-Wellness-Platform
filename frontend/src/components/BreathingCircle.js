import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_INHALE_MS = 4000;
const DEFAULT_HOLD_MS = 2000;
const DEFAULT_EXHALE_MS = 6000;
const DEFAULT_HOLD2_MS = 0;

function buildPhases(hold2Ms) {
  if (hold2Ms > 0) {
    return ['Breathe in...', 'Hold...', 'Breathe out...', 'Hold...'];
  }
  return ['Breathe in...', 'Hold...', 'Breathe out...'];
}

export function BreathingCircle({
  size = 200,
  autoStart = true,
  inhaleMs = DEFAULT_INHALE_MS,
  holdMs = DEFAULT_HOLD_MS,
  exhaleMs = DEFAULT_EXHALE_MS,
  hold2Ms = DEFAULT_HOLD2_MS,
  cycles = 1,
  onCycleComplete,
  onSessionComplete,
  isPaused = false,
}) {
  const { colors, fonts } = useTheme();
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.7);
  const phases = buildPhases(hold2Ms);
  const [phaseText, setPhaseText] = useState(autoStart ? phases[0] : '');
  const [isRunning, setIsRunning] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const timersRef = useRef([]);
  const isPausedRef = useRef(isPaused);
  const onCycleCompleteRef = useRef(onCycleComplete);
  const onSessionCompleteRef = useRef(onSessionComplete);

  // Keep refs in sync with props without causing re-renders
  useEffect(() => {
    onCycleCompleteRef.current = onCycleComplete;
  }, [onCycleComplete]);
  useEffect(() => {
    onSessionCompleteRef.current = onSessionComplete;
  }, [onSessionComplete]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    if (isPaused) {
      clearTimers();
      cancelAnimation(scale);
      cancelAnimation(opacity);
    }
  }, [isPaused, scale, opacity]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const addTimer = useCallback((fn, delay) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  }, []);

  // Stable runCycle that reads callbacks from refs
  const runCycle = useCallback(
    (cycleIndex) => {
      if (isPausedRef.current) return;
      setIsRunning(true);
      setPhaseText(phases[0]);

      const cycleMs = inhaleMs + holdMs + exhaleMs + hold2Ms;

      const scaleSteps = [
        withTiming(1.0, { duration: inhaleMs, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: holdMs }),
        withTiming(0.6, { duration: exhaleMs, easing: Easing.inOut(Easing.ease) }),
      ];
      if (hold2Ms > 0) {
        scaleSteps.push(withTiming(0.6, { duration: hold2Ms }));
      }
      scale.value = withSequence(...scaleSteps);

      const opacitySteps = [
        withTiming(1.0, { duration: inhaleMs, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.85, { duration: holdMs }),
        withTiming(0.7, { duration: exhaleMs, easing: Easing.inOut(Easing.ease) }),
      ];
      if (hold2Ms > 0) {
        opacitySteps.push(withTiming(0.7, { duration: hold2Ms }));
      }
      opacity.value = withSequence(...opacitySteps);

      // Phase text transitions
      addTimer(() => setPhaseText(phases[1]), inhaleMs);
      addTimer(() => setPhaseText(phases[2]), inhaleMs + holdMs);
      if (hold2Ms > 0) {
        addTimer(() => setPhaseText(phases[3]), inhaleMs + holdMs + exhaleMs);
      }

      // Cycle complete
      addTimer(() => {
        if (isPausedRef.current) return;
        const nextCycle = cycleIndex + 1;
        setCurrentCycle(nextCycle);
        onCycleCompleteRef.current?.();

        if (nextCycle >= cycles) {
          setIsRunning(false);
          setPhaseText('');
          onSessionCompleteRef.current?.();
        } else {
          runCycle(nextCycle);
        }
      }, cycleMs);
    },
    // Only re-create when timing/cycle props change, NOT when callbacks change
    [scale, opacity, inhaleMs, holdMs, exhaleMs, hold2Ms, cycles, phases, addTimer]
  );

  // Start on mount (once)
  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(() => runCycle(0), 300);
      return () => {
        clearTimeout(timer);
        clearTimers();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const animatedCircle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.primary,
          },
          shadow,
          animatedCircle,
        ]}
      />
      <Text style={[fonts.heading3, styles.phaseText, { color: colors.textSecondary }]}>
        {phaseText}
      </Text>
    </View>
  );
}

const shadow = Platform.select({
  ios: {
    shadowColor: '#5B7F6E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  android: { elevation: 12 },
  default: {},
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseText: {
    marginTop: 32,
    textAlign: 'center',
  },
});
