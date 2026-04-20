/**
 * Skia particle bloom — fires from a position on demand.
 *
 * Usage:
 *   const ref = useRef();
 *   <ParticleBloom ref={ref} color={palette.accent} />
 *   ref.current?.bloom({ x: 200, y: 400 });
 *
 * Auto-fires success haptic unless suppressed.
 */

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useV2Theme } from '../../theme/v2';
import { useHaptic } from './hooks/useHaptic';
import { useReducedMotion } from './hooks/useReducedMotion';

const PARTICLE_COUNT = 16;
const SPREAD = 80;

/**
 * @typedef {Object} ParticleBloomRef
 * @property {(opts?: { x?: number, y?: number, count?: number, suppressHaptic?: boolean }) => void} bloom
 */

export const ParticleBloom = forwardRef(function ParticleBloom(
  { color, suppressHaptic = false },
  ref
) {
  const { palette } = useV2Theme();
  const haptic = useHaptic();
  const reduced = useReducedMotion();
  const fill = color ?? palette.accent;

  const [burst, setBurst] = useState(null);

  useImperativeHandle(
    ref,
    () => ({
      bloom: (opts = {}) => {
        if (reduced) {
          // Honour reduce-motion: skip the visual, keep the (informative) haptic.
          if (!suppressHaptic) haptic('success');
          return;
        }
        const x = opts.x ?? 100;
        const y = opts.y ?? 100;
        const count = opts.count ?? PARTICLE_COUNT;
        const id = Date.now();
        setBurst({ id, x, y, count });
        if (!suppressHaptic) haptic('success');
        setTimeout(() => setBurst((b) => (b?.id === id ? null : b)), 800);
      },
    }),
    [haptic, reduced, suppressHaptic]
  );

  if (!burst || Platform.OS === 'web') {
    // Web also gets the imperative API but skips the rendering for now.
    return <View pointerEvents="none" style={StyleSheet.absoluteFill} />;
  }

  const particles = Array.from({ length: burst.count }).map((_, i) => {
    const angle = (i / burst.count) * Math.PI * 2;
    const distance = SPREAD * (0.6 + Math.random() * 0.4);
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const size = 4 + Math.random() * 4;
    return { i, dx, dy, size };
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p) => (
        <MotiView
          key={`${burst.id}-${p.i}`}
          from={{
            translateX: burst.x,
            translateY: burst.y,
            opacity: 1,
            scale: 1,
          }}
          animate={{
            translateX: burst.x + p.dx,
            translateY: burst.y + p.dy,
            opacity: 0,
            scale: 0.4,
          }}
          transition={{ type: 'timing', duration: 700 }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: fill,
          }}
        />
      ))}
    </View>
  );
});

export default ParticleBloom;
