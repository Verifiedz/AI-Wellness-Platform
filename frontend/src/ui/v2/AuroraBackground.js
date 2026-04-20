/**
 * Signature visual — Skia mesh gradient that breathes at the v2 ambient cadence.
 *
 * Uses two animated radial gradients composed over a Blur layer; runs entirely on the GPU.
 * On web, lazy-loads CanvasKit (2.9MB WASM) and falls back to a CSS gradient until ready.
 *
 * Props let consumers tune intensity per screen (subtle for Home, vivid for Breathing).
 */

import React, { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSharedValue, useDerivedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useV2Theme } from '../../theme/v2';
import { useReducedMotion } from './hooks/useReducedMotion';

let SkiaModule = null;
if (Platform.OS !== 'web') {
  SkiaModule = require('@shopify/react-native-skia');
}

const INTENSITY_OPACITY = {
  subtle: 0.35,
  normal: 0.6,
  vivid: 0.85,
};

/**
 * @param {{
 *   intensity?: 'subtle'|'normal'|'vivid',
 *   breathSync?: boolean,
 *   paused?: boolean,
 *   seed?: number,
 *   style?: any,
 * }} props
 */
export function AuroraBackground({
  intensity = 'normal',
  breathSync = true,
  paused = false,
  seed = 0,
  style,
}) {
  const { palette, isDark, motion } = useV2Theme();
  const reduced = useReducedMotion();
  const isPaused = paused || reduced;

  // Web fallback — pure CSS gradient. Catches all of: SSR, dev iteration speed, low-end.
  if (Platform.OS === 'web' || !SkiaModule) {
    return <WebAurora palette={palette} isDark={isDark} intensity={intensity} style={style} seed={seed} />;
  }

  return (
    <NativeAurora
      palette={palette}
      isDark={isDark}
      intensity={intensity}
      breathSync={breathSync}
      paused={isPaused}
      seed={seed}
      duration={motion.duration.ambient}
      style={style}
    />
  );
}

function NativeAurora({ palette, isDark, intensity, breathSync, paused, seed, duration, style }) {
  const { Canvas, Group, Rect, RadialGradient, vec, Blur, Paint } = SkiaModule;
  const t = useSharedValue(0);

  useEffect(() => {
    if (paused) {
      t.value = 0;
      return;
    }
    t.value = withRepeat(
      withTiming(1, { duration: breathSync ? duration : 12000, easing: Easing.bezier(0.4, 0, 0.4, 1) }),
      -1,
      true
    );
  }, [paused, breathSync, duration, t]);

  const SCREEN_W = 600;
  const SCREEN_H = 1200;
  const opacity = INTENSITY_OPACITY[intensity] ?? INTENSITY_OPACITY.normal;
  const colorStopA = isDark
    ? [palette.primary, 'transparent']
    : [palette.primary, 'transparent'];
  const colorStopB = isDark
    ? [palette.accent, 'transparent']
    : [palette.accent, 'transparent'];

  const c1 = useDerivedValue(() => {
    const offset = Math.sin((t.value + seed * 0.1) * Math.PI * 2);
    return vec(SCREEN_W * 0.25 + 60 * offset, SCREEN_H * 0.3 + 40 * offset);
  });
  const c2 = useDerivedValue(() => {
    const offset = Math.cos((t.value + seed * 0.13) * Math.PI * 2);
    return vec(SCREEN_W * 0.75 + 80 * offset, SCREEN_H * 0.65 + 60 * offset);
  });

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg.base }, style]} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Group opacity={opacity} layer={<Paint><Blur blur={50} /></Paint>}>
          <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H}>
            <RadialGradient c={c1} r={SCREEN_W * 0.55} colors={colorStopA} />
          </Rect>
          <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H}>
            <RadialGradient c={c2} r={SCREEN_W * 0.6} colors={colorStopB} />
          </Rect>
        </Group>
      </Canvas>
    </View>
  );
}

function WebAurora({ palette, isDark, intensity, style, seed }) {
  const opacity = INTENSITY_OPACITY[intensity] ?? INTENSITY_OPACITY.normal;
  // Two radial gradients positioned with a tiny seed offset for variety per session.
  const dx = (seed * 7) % 20;
  const dy = (seed * 11) % 20;
  const styleObj = useMemo(
    () => ({
      backgroundImage: [
        `radial-gradient(ellipse 60% 50% at ${30 + dx}% ${25 + dy}%, ${palette.primary}, transparent 60%)`,
        `radial-gradient(ellipse 60% 60% at ${70 - dx}% ${75 - dy}%, ${palette.accent}, transparent 60%)`,
      ].join(', '),
      backgroundColor: palette.bg.base,
      filter: `blur(40px)`,
      opacity,
      // Aurora drifts via CSS keyframes — keep it simple and SSR-friendly.
      animation: 'sakina-aurora-drift 12s ease-in-out infinite alternate',
    }),
    [palette, opacity, dx, dy]
  );

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: palette.bg.base }, style]}
      pointerEvents="none"
    >
      {Platform.OS === 'web' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            ...styleObj,
          }}
        />
      ) : null}
      {Platform.OS === 'web' ? (
        <style>{`
          @keyframes sakina-aurora-drift {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(2%, -1%) scale(1.05); }
          }
        `}</style>
      ) : null}
    </View>
  );
}

export default AuroraBackground;
