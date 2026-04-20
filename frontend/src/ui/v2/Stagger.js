/**
 * Stagger — drops its children into view with a small upward fade, offset per
 * sibling. Cheap to render (entering animations only), respects reduced motion.
 *
 * Usage:
 *   <Stagger>
 *     <Card />
 *     <Card />
 *     <Card />
 *   </Stagger>
 *
 * Or per-item with manual index:
 *   <StaggerItem index={i} />
 */

import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useReducedMotion } from './hooks/useReducedMotion';

const STEP_MS = 60;
const DURATION_MS = 320;

/**
 * @param {{ children: React.ReactNode, step?: number, duration?: number, baseDelay?: number, style?: any }} props
 */
export function Stagger({ children, step = STEP_MS, duration = DURATION_MS, baseDelay = 0, style }) {
  const reduced = useReducedMotion();
  const items = React.Children.toArray(children).filter(Boolean);
  if (reduced) {
    return <>{items}</>;
  }
  return (
    <>
      {items.map((child, idx) => (
        <Animated.View
          key={idx}
          entering={FadeInDown.delay(baseDelay + idx * step).duration(duration)}
          style={style}
        >
          {child}
        </Animated.View>
      ))}
    </>
  );
}

/**
 * StaggerItem — when you need to control delay per-item (e.g., FlashList rows).
 */
export function StaggerItem({ index = 0, step = STEP_MS, duration = DURATION_MS, baseDelay = 0, style, children }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <Animated.View
      entering={FadeInDown.delay(baseDelay + index * step).duration(duration)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export default Stagger;
