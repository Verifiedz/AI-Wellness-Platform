/**
 * Custom themed slider. 1.5pt track + 24pt thumb with subtle glow when active.
 * Haptic ticks at 25/50/75/100%.
 */

import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { useV2Theme } from '../../theme/v2';
import { useHaptic } from './hooks/useHaptic';

const TRACK_HEIGHT = 3;
const THUMB = 24;

/**
 * @param {{
 *   value: number,
 *   min?: number,
 *   max?: number,
 *   onChange: (value: number) => void,
 *   width?: number,
 *   disabled?: boolean,
 *   accessibilityLabel?: string,
 *   style?: any,
 * }} props
 */
export function Slider({
  value,
  min = 0,
  max = 1,
  onChange,
  width = 280,
  disabled = false,
  accessibilityLabel,
  style,
}) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();

  const trackWidth = width - THUMB;
  const offset = useSharedValue(((value - min) / (max - min)) * trackWidth);
  const startOffset = useSharedValue(0);
  const lastTick = useSharedValue(-1);

  useEffect(() => {
    offset.value = withTiming(((value - min) / (max - min)) * trackWidth, { duration: 120 });
  }, [value, min, max, trackWidth, offset]);

  const emitChange = useCallback(
    (raw) => {
      const next = min + (raw / trackWidth) * (max - min);
      onChange?.(Math.max(min, Math.min(max, next)));
    },
    [min, max, onChange, trackWidth]
  );

  const tickHaptic = useCallback(() => fireHaptic('tap'), [fireHaptic]);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      'worklet';
      startOffset.value = offset.value;
    })
    .onUpdate((e) => {
      'worklet';
      const next = Math.max(0, Math.min(trackWidth, startOffset.value + e.translationX));
      offset.value = next;
      const tick = Math.floor((next / trackWidth) * 4); // 0..4 quartiles
      if (tick !== lastTick.value) {
        lastTick.value = tick;
        runOnJS(tickHaptic)();
      }
      runOnJS(emitChange)(next);
    });

  const fillStyle = useAnimatedStyle(() => ({ width: offset.value + THUMB / 2 }));
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return (
    <GestureDetector gesture={pan}>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min, max, now: value }}
        style={[{ width, height: THUMB, justifyContent: 'center', opacity: disabled ? 0.5 : 1 }, style]}
      >
        {/* Track */}
        <View
          style={{
            position: 'absolute',
            left: THUMB / 2,
            right: THUMB / 2,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT,
            backgroundColor: v2.palette.border.strong,
          }}
        />
        {/* Fill */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: THUMB / 2,
              height: TRACK_HEIGHT,
              borderRadius: TRACK_HEIGHT,
              backgroundColor: v2.palette.primary,
            },
            fillStyle,
          ]}
        />
        {/* Thumb */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: v2.palette.bg.surface,
              borderWidth: 2,
              borderColor: v2.palette.primary,
            },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}

export default Slider;
