/**
 * Icon-only button. 48x48 minimum hit area. accessibilityLabel REQUIRED.
 *
 * Variants:
 *   solid   — filled surface; for header actions
 *   ghost   — transparent; for inline / inside text rows
 *   accent  — accent fill; for primary actions
 */

import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useV2Theme } from '../../theme/v2';
import { useHaptic } from './hooks/useHaptic';

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

/**
 * @param {{
 *   icon: React.ComponentType<any>,
 *   accessibilityLabel: string,
 *   onPress?: () => void,
 *   variant?: 'solid'|'ghost'|'accent',
 *   size?: 'sm'|'md'|'lg',
 *   weight?: 'thin'|'light'|'regular'|'bold'|'fill'|'duotone',
 *   haptic?: 'tap'|'soft'|'firm'|'strong'|'success'|'warn'|'error',
 *   disabled?: boolean,
 *   style?: any,
 * }} props
 */
export function IconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  variant = 'ghost',
  size = 'md',
  weight = 'duotone',
  haptic = 'tap',
  disabled = false,
  style,
}) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();

  if (!accessibilityLabel) {
    // Visible warning during dev — every icon-only control needs an a11y label.
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('<IconButton> requires accessibilityLabel');
    }
  }

  const dim = size === 'sm' ? 40 : size === 'lg' ? 56 : 48;
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 26 : 22;
  const colors = getVariantColors(variant, v2.palette);

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.92, v2.motion.spring.snap);
    fireHaptic(haptic);
  }, [scale, fireHaptic, haptic, v2.motion.spring.snap]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, v2.motion.spring.snap);
  }, [scale, v2.motion.spring.snap]);

  return (
    <Animated.View style={[{ width: dim, height: dim, borderRadius: dim / 2 }, animStyle, style]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : onPressIn}
        onPressOut={disabled ? undefined : onPressOut}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        android_ripple={null}
        style={({ pressed }) => ({
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: colors.bg,
          borderWidth: colors.borderWidth,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          outline: 'none',
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
          outlineOffset: 0,
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
        })}
      >
        <View pointerEvents="none">
          <Icon size={iconSize} color={colors.icon} weight={weight} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function getVariantColors(variant, palette) {
  switch (variant) {
    case 'solid':
      return {
        bg: palette.bg.surface,
        icon: palette.text.primary,
        border: palette.border.subtle,
        borderWidth: 1,
      };
    case 'accent':
      return {
        bg: palette.primary,
        icon: palette.text.onPrimary,
        border: 'transparent',
        borderWidth: 0,
      };
    case 'ghost':
    default:
      return {
        bg: 'transparent',
        icon: palette.text.primary,
        border: 'transparent',
        borderWidth: 0,
      };
  }
}

export default IconButton;
