import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";

const INHALE_MS = 4000;
const HOLD_MS = 2000;
const EXHALE_MS = 6000;
const CYCLE_MS = INHALE_MS + HOLD_MS + EXHALE_MS;

const PHASES = ["Breathe in...", "Hold...", "Breathe out..."];

export function BreathingCircle({
  size = 200,
  autoStart = true,
  onCycleComplete,
}) {
  const { colors, fonts } = useTheme();
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.7);
  const [phaseText, setPhaseText] = useState(autoStart ? PHASES[0] : "");
  const [isRunning, setIsRunning] = useState(false);

  const setPhase = useCallback((idx) => {
    setPhaseText(PHASES[idx] || "");
  }, []);

  const onComplete = useCallback(() => {
    setIsRunning(false);
    onCycleComplete?.();
  }, [onCycleComplete]);

  const startCycle = useCallback(() => {
    setIsRunning(true);
    setPhase(0);

    scale.value = withSequence(
      withTiming(1.0, { duration: INHALE_MS, easing: Easing.inOut(Easing.ease) }),
      withTiming(1.0, { duration: HOLD_MS }),
      withTiming(0.6, { duration: EXHALE_MS, easing: Easing.inOut(Easing.ease) })
    );

    opacity.value = withSequence(
      withTiming(1.0, { duration: INHALE_MS, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.85, { duration: HOLD_MS }),
      withTiming(0.7, { duration: EXHALE_MS, easing: Easing.inOut(Easing.ease) })
    );

    // Phase text transitions via JS timeouts
    setTimeout(() => setPhase(1), INHALE_MS);
    setTimeout(() => setPhase(2), INHALE_MS + HOLD_MS);
    setTimeout(() => onComplete(), CYCLE_MS);
  }, [scale, opacity, setPhase, onComplete]);

  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(startCycle, 300);
      return () => clearTimeout(timer);
    }
  }, [autoStart, startCycle]);

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
      <Text
        style={[
          fonts.heading3,
          styles.phaseText,
          { color: colors.textSecondary },
        ]}
      >
        {phaseText}
      </Text>
    </View>
  );
}

const shadow = Platform.select({
  ios: {
    shadowColor: "#5B7F6E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
  },
  android: { elevation: 12 },
  default: {},
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  phaseText: {
    marginTop: 32,
    textAlign: "center",
  },
});
