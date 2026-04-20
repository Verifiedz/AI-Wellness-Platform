/**
 * Custom themed switch — never the system default.
 *
 * Spring animation on toggle, haptic tap. 48x48 hit area; visible thumb 24px.
 */

import React, { useCallback, useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useV2Theme } from '../../theme/v2';
import { useHaptic } from './hooks/useHaptic';

const TRACK_W = 48;
const TRACK_H = 28;
const THUMB = 24;

/**
 * @param {{
 *   value: boolean,
 *   onChange: (next: boolean) => void,
 *   disabled?: boolean,
 *   accessibilityLabel?: string,
 *   style?: any,
 * }} props
 */
export function Switch({ value, onChange, disabled = false, accessibilityLabel, style }) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();
  const t = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    t.value = withSpring(value ? 1 : 0, v2.motion.spring.snap);
  }, [value, t, v2.motion.spring.snap]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      t.value,
      [0, 1],
      [v2.palette.border.strong, v2.palette.primary]
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(t.value * (TRACK_W - THUMB - 4), { duration: 200 }) }],
  }));

  const handle = useCallback(() => {
    if (disabled) return;
    fireHaptic('tap');
    onChange?.(!value);
  }, [disabled, fireHaptic, onChange, value]);

  return (
    <Pressable
      onPress={handle}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={[{ opacity: disabled ? 0.5 : 1 }, style]}
    >
      <Animated.View
        style={[
          {
            width: TRACK_W,
            height: TRACK_H,
            borderRadius: TRACK_H / 2,
            justifyContent: 'center',
            paddingHorizontal: 2,
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: v2.palette.bg.surface,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

export default Switch;
