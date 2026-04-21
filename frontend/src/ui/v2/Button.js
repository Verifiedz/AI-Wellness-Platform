/**
 * Themed button — variant + size + haptic + spring press physics + loading state.
 *
 * Variants:
 *   primary     — filled accent, onAccent text
 *   secondary   — surface fill, primary text, subtle border
 *   ghost       — transparent, primary text (for tertiary actions)
 *   destructive — error fill, onAccent text
 *
 * Loading state: caption stays visible; Blob spins to its right; pointerEvents disabled.
 * Haptic fires on press peak, not release.
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
import { Text } from './Text';
import { Blob } from './Blob';

const SIZE_STYLES = {
  sm: { minHeight: 40, paddingX: 14, fontVariant: 'body-sm' },
  md: { minHeight: 48, paddingX: 18, fontVariant: 'body' },
  lg: { minHeight: 56, paddingX: 22, fontVariant: 'body-lg' },
};

/**
 * @param {{
 *   variant?: 'primary'|'secondary'|'ghost'|'destructive',
 *   size?: 'sm'|'md'|'lg',
 *   fullWidth?: boolean,
 *   loading?: boolean,
 *   disabled?: boolean,
 *   onPress?: () => void,
 *   leadingIcon?: React.ComponentType<any>,
 *   trailingIcon?: React.ComponentType<any>,
 *   haptic?: 'tap'|'soft'|'firm'|'strong'|'success'|'warn'|'error',
 *   accessibilityLabel?: string,
 *   children?: any,
 *   style?: any,
 * }} props
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  onPress,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  haptic = 'firm',
  accessibilityLabel,
  children,
  style,
}) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();
  const sizeCfg = SIZE_STYLES[size] ?? SIZE_STYLES.md;

  const isDisabled = disabled || loading;
  const colors = getVariantColors(variant, v2.palette, isDisabled);

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.97, v2.motion.spring.snap);
    fireHaptic(haptic);
  }, [scale, fireHaptic, haptic, v2.motion.spring.snap]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, v2.motion.spring.snap);
  }, [scale, v2.motion.spring.snap]);

  const accessibilityState = {
    disabled: isDisabled,
    busy: loading,
  };

  return (
    <Animated.View style={[fullWidth ? { alignSelf: 'stretch' } : null, animStyle, style]}>
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={isDisabled ? undefined : onPressIn}
        onPressOut={isDisabled ? undefined : onPressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
        android_ripple={null}
        style={({ pressed }) => ({
          minHeight: sizeCfg.minHeight,
          paddingHorizontal: sizeCfg.paddingX,
          paddingVertical: 8,
          borderRadius: v2.radius.full,
          backgroundColor: colors.bg,
          borderWidth: colors.borderWidth,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.55 : pressed ? 0.92 : 1,
          overflow: 'hidden',
          // Web + native: kill every rectangular focus/tap highlight that
          // would clash with the pill shape. Press scale + opacity already
          // feedback the tap.
          outline: 'none',
          outlineStyle: 'none',
          outlineWidth: 0,
          outlineColor: 'transparent',
          outlineOffset: 0,
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none',
        })}
      >
        {LeadingIcon ? (
          <View style={{ marginRight: 8 }}>
            <LeadingIcon size={20} color={colors.text} weight="duotone" />
          </View>
        ) : null}
        <Text
          variant={sizeCfg.fontVariant}
          style={{ color: colors.text, fontFamily: 'DMSans_600SemiBold' }}
        >
          {children}
        </Text>
        {loading ? (
          <View style={{ marginLeft: 10 }}>
            <Blob size={18} color={colors.text} />
          </View>
        ) : TrailingIcon ? (
          <View style={{ marginLeft: 8 }}>
            <TrailingIcon size={20} color={colors.text} weight="duotone" />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function getVariantColors(variant, palette, disabled) {
  switch (variant) {
    case 'primary':
      return {
        bg: palette.primary,
        text: palette.text.onPrimary,
        border: 'transparent',
        borderWidth: 0,
      };
    case 'secondary':
      return {
        bg: palette.bg.surface,
        text: palette.text.primary,
        border: palette.border.subtle,
        borderWidth: 1,
      };
    case 'ghost':
      return {
        bg: 'transparent',
        text: palette.primary,
        border: 'transparent',
        borderWidth: 0,
      };
    case 'destructive':
      return {
        bg: palette.error,
        text: palette.text.onPrimary,
        border: 'transparent',
        borderWidth: 0,
      };
    default:
      return {
        bg: palette.primary,
        text: palette.text.onPrimary,
        border: 'transparent',
        borderWidth: 0,
      };
  }
}

export default Button;
