/**
 * Breathing-rings loader — three concentric rings that pulse at staggered
 * phases, evoking a calm breath rather than a morphing amoeba.
 *
 * Replaces every spinner in the app. Kept the filename/export as `Blob` so
 * existing imports (`import { Blob } from '../../ui/v2'`) continue to work.
 *
 * Usage:
 *   <Blob />                       // default 48px accent rings
 *   <Blob size={64} speed="slow"/>
 *   <Blob paused />                 // for reduce-motion contexts
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useV2Theme } from '../../theme/v2';
import { useReducedMotion } from './hooks/useReducedMotion';

const SPEED_DURATION = { slow: 2400, normal: 1800, fast: 1200 };

/**
 * @param {{
 *   size?: number,
 *   color?: string,
 *   paused?: boolean,
 *   speed?: 'slow'|'normal'|'fast',
 *   style?: any,
 * }} props
 */
export function Blob({ size = 48, color, paused = false, speed = 'normal', style }) {
  const { palette } = useV2Theme();
  const reduced = useReducedMotion();
  const isPaused = paused || reduced;
  const stroke = color ?? palette.primary;
  const core = color ?? palette.accent;
  const dur = SPEED_DURATION[speed] ?? SPEED_DURATION.normal;

  return (
    <View
      style={[
        { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <Ring size={size} color={stroke} delay={0} dur={dur} paused={isPaused} />
      <Ring size={size} color={stroke} delay={dur / 3} dur={dur} paused={isPaused} />
      <Ring size={size} color={stroke} delay={(dur * 2) / 3} dur={dur} paused={isPaused} />
      <Core size={size * 0.32} color={core} dur={dur} paused={isPaused} />
    </View>
  );
}

function Ring({ size, color, delay, dur, paused }) {
  const t = useSharedValue(paused ? 1 : 0);

  useEffect(() => {
    if (paused) {
      t.value = 1;
      return;
    }
    t.value = 0;
    t.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: dur, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        -1,
        false
      )
    );
  }, [paused, delay, dur, t]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.35 + 0.65 * t.value }],
    opacity: paused ? 0.25 : (1 - t.value) * 0.55,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: Math.max(1.25, size * 0.03),
          borderColor: color,
        },
        animStyle,
      ]}
    />
  );
}

function Core({ size, color, dur, paused }) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (paused) {
      t.value = 0;
      return;
    }
    t.value = withRepeat(
      withTiming(1, { duration: dur, easing: Easing.bezier(0.4, 0, 0.4, 1) }),
      -1,
      true
    );
  }, [paused, dur, t]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.88 + 0.12 * t.value }],
    opacity: 0.8 + 0.2 * t.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

export default Blob;
