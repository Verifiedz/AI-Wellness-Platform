/**
 * Hairline circular progress — 1.5pt SVG arc. Never a thick bar.
 *
 * Usage:
 *   <ProgressRing progress={0.7} size={56} />
 */

import React, { useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useV2Theme } from '../../theme/v2';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * @param {{
 *   progress: number,
 *   size?: number,
 *   strokeWidth?: number,
 *   duration?: number,
 *   color?: string,
 *   trackColor?: string,
 *   children?: any,
 * }} props
 */
export function ProgressRing({
  progress,
  size = 56,
  strokeWidth = 2,
  duration = 600,
  color,
  trackColor,
  children,
}) {
  const { palette } = useV2Theme();
  const accent = color ?? palette.accent;
  const track = trackColor ?? palette.border.subtle;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const sv = useSharedValue(0);

  useEffect(() => {
    sv.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, [progress, duration, sv]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - sv.value),
  }));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={track}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={accent}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        fill="none"
      />
      {children}
    </Svg>
  );
}

export default ProgressRing;
