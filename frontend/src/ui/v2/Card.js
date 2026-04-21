/**
 * Bento-style card. Press physics (scale 0.98 spring), optional glass variant.
 *
 * Variants:
 *   tonal — surface fill (default)
 *   glass — GlassPanel backdrop
 */

import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useV2Theme } from '../../theme/v2';
import { useHaptic } from './hooks/useHaptic';
import { GlassPanel } from './GlassPanel';

/**
 * @param {{
 *   variant?: 'tonal'|'glass',
 *   onPress?: () => void,
 *   onLongPress?: () => void,
 *   accessibilityLabel?: string,
 *   accessibilityRole?: string,
 *   padding?: 0|1|2|3|4|5|6|8|10|12|16|20,
 *   radius?: 'sm'|'md'|'lg'|'xl'|'2xl'|'3xl',
 *   style?: any,
 *   children?: any,
 * }} props
 */
export function Card({
  variant = 'tonal',
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityRole,
  padding = 4,
  radius = 'xl',
  style,
  children,
}) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();
  const pressable = !!(onPress || onLongPress);

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.98, v2.motion.spring.snap);
  }, [scale, v2.motion.spring.snap]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, v2.motion.spring.snap);
  }, [scale, v2.motion.spring.snap]);

  const handlePress = useCallback(() => {
    fireHaptic('soft');
    onPress?.();
  }, [fireHaptic, onPress]);

  const handleLongPress = useCallback(() => {
    fireHaptic('firm');
    onLongPress?.();
  }, [fireHaptic, onLongPress]);

  const innerStyle = {
    padding: v2.spacing[padding],
    borderRadius: v2.radius[radius],
  };

  const inner = variant === 'glass'
    ? (
      <GlassPanel padding={padding} radius={radius}>
        {children}
      </GlassPanel>
    )
    : children;

  if (!pressable) {
    return (
      <Animated.View
        style={[
          variant === 'tonal'
            ? {
                backgroundColor: v2.palette.bg.surface,
                borderWidth: 1,
                borderColor: v2.palette.border.subtle,
                ...innerStyle,
              }
            : { borderRadius: v2.radius[radius] },
          style,
        ]}
      >
        {inner}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole={accessibilityRole ?? 'button'}
        accessibilityLabel={accessibilityLabel}
        // Suppress the default browser tap-highlight + focus ring on web —
        // Pressable's pressed state already provides our own visual feedback,
        // and the rectangular outline clashes with the rounded card.
        android_ripple={null}
        style={({ pressed, focused }) => [
          variant === 'tonal'
            ? {
                backgroundColor: v2.palette.bg.surface,
                borderWidth: 1,
                borderColor: v2.palette.border.subtle,
                ...innerStyle,
              }
            : { borderRadius: v2.radius[radius], overflow: 'hidden' },
          // Web-only: kill the focus ring; reinstate a soft accent border on
          // keyboard focus so a11y users still see the active card.
          { outlineStyle: 'none', WebkitTapHighlightColor: 'transparent' },
          focused ? { borderColor: v2.palette.primary } : null,
        ]}
      >
        {inner}
      </Pressable>
    </Animated.View>
  );
}

export default Card;
