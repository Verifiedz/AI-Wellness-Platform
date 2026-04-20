/**
 * Skia-rendered organic blob morph — replaces every spinner in the app.
 *
 * Two SVG path shapes; interpolates between them on a Reanimated shared value.
 * On web, falls back to a CSS-animated blob (filter: blur + scale loop).
 *
 * Usage:
 *   <Blob />                       // default 48px accent blob
 *   <Blob size={64} speed="slow"/>
 *   <Blob paused />                 // for reduce-motion contexts
 */

import React, { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useV2Theme } from '../../theme/v2';
import { useReducedMotion } from './hooks/useReducedMotion';

let SkiaModule = null;
if (Platform.OS !== 'web') {
  SkiaModule = require('@shopify/react-native-skia');
}

const SPEED_DURATION = { slow: 2400, normal: 1600, fast: 1000 };

// Two organic blob paths roughly bounded to a 100×100 box.
const BLOB_A = 'M50 5 C72 5 95 22 95 50 C95 78 72 95 50 95 C28 95 5 78 5 50 C5 22 28 5 50 5 Z';
const BLOB_B = 'M50 8 C78 12 92 30 90 52 C88 78 70 92 48 90 C22 88 8 70 12 48 C16 22 30 4 50 8 Z';

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
  const fill = color ?? palette.accent;
  const dur = SPEED_DURATION[speed] ?? SPEED_DURATION.normal;

  if (Platform.OS === 'web' || !SkiaModule) {
    return <WebBlob size={size} color={fill} paused={isPaused} dur={dur} style={style} />;
  }
  return <NativeBlob size={size} color={fill} paused={isPaused} dur={dur} style={style} />;
}

function NativeBlob({ size, color, paused, dur, style }) {
  const { Canvas, Path, Skia, Group } = SkiaModule;
  const t = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    if (paused) {
      t.value = 0;
      rot.value = 0;
      return;
    }
    t.value = withRepeat(withTiming(1, { duration: dur, easing: Easing.bezier(0.4, 0, 0.4, 1) }), -1, true);
    rot.value = withRepeat(withTiming(360, { duration: dur * 4, easing: Easing.linear }), -1, false);
  }, [paused, dur, t, rot]);

  const pathA = Skia.Path.MakeFromSVGString(BLOB_A);
  const pathB = Skia.Path.MakeFromSVGString(BLOB_B);

  const morphPath = useDerivedValue(() => {
    'worklet';
    if (!pathA || !pathB) return null;
    return pathA.interpolate(pathB, t.value);
  });

  const transform = useDerivedValue(() => {
    'worklet';
    return [{ rotate: (rot.value * Math.PI) / 180 }];
  });

  const origin = useDerivedValue(() => {
    'worklet';
    return { x: size / 2, y: size / 2 };
  });

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group transform={transform} origin={origin}>
          <Path path={morphPath} color={color} style="fill" />
        </Group>
      </Canvas>
    </View>
  );
}

function WebBlob({ size, color, paused, dur, style }) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (paused) {
      t.value = 0;
      return;
    }
    t.value = withRepeat(withTiming(1, { duration: dur, easing: Easing.bezier(0.4, 0, 0.4, 1) }), -1, true);
  }, [paused, dur, t]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 0.92 + 0.08 * t.value },
      { rotate: `${t.value * 90}deg` },
    ],
    borderRadius: 38 + 6 * t.value,
  }));
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View
        style={[
          {
            width: size * 0.92,
            height: size * 0.92,
            backgroundColor: color,
          },
          animStyle,
        ]}
      />
    </View>
  );
}

export default Blob;
