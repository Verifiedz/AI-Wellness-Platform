/**
 * Looping breathing pulse — universal idle/ambient motion primitive.
 *
 * Use as a wrapper to make any node breathe:
 *   <BreathingPulse><MoodCrystal /></BreathingPulse>
 *
 * Or standalone (renders an empty pulsing dot):
 *   <BreathingPulse pace="slow" />
 *
 * Cadence:
 *   slow   = 6s cycle (deep meditation)
 *   normal = 4s cycle (default)
 *   fast   = 2s cycle (sense-of-life states)
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useV2Theme } from '../../theme/v2';

const PACE_DURATION = { slow: 3000, normal: 2000, fast: 1000 };

/**
 * @param {{
 *   pace?: 'slow'|'normal'|'fast',
 *   paused?: boolean,
 *   minScale?: number,
 *   maxScale?: number,
 *   children?: any,
 *   style?: any,
 * }} props
 */
export function BreathingPulse({
  pace = 'normal',
  paused = false,
  minScale = 0.96,
  maxScale = 1.04,
  children,
  style,
}) {
  const reduced = useReducedMotion();
  const isPaused = paused || reduced;
  const half = PACE_DURATION[pace] ?? PACE_DURATION.normal;
  const scale = useSharedValue(1);
  const opacity = useSharedValue(maxScale > 1 ? 0.85 : 1);

  useEffect(() => {
    if (isPaused) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: half, easing: Easing.bezier(0.4, 0, 0.4, 1) }),
        withTiming(minScale, { duration: half, easing: Easing.bezier(0.4, 0, 0.4, 1) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: half, easing: Easing.bezier(0.4, 0, 0.4, 1) }),
        withTiming(0.7, { duration: half, easing: Easing.bezier(0.4, 0, 0.4, 1) })
      ),
      -1,
      false
    );
  }, [isPaused, half, minScale, maxScale, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (children) {
    return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
  }
  return <DefaultPulseDot animStyle={animStyle} style={style} />;
}

function DefaultPulseDot({ animStyle, style }) {
  const { palette } = useV2Theme();
  return (
    <View style={[{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View
        style={[
          {
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: palette.accent,
          },
          animStyle,
        ]}
      />
    </View>
  );
}

export default BreathingPulse;
