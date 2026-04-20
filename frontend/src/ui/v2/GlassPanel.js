/**
 * Glassmorphism wrapper. Wraps expo-blur with sane defaults and a graceful Android degrade.
 *
 * Strategy:
 *   - iOS: real UIVisualEffectView blur via expo-blur. Premium experience.
 *   - Android (high tier): experimentalBlurMethod="dimezisBlurView" — real GPU blur.
 *   - Android (low tier) / Web: translucent surface fallback (no blur).
 *
 * Always sets overflow:hidden so children respect the radius.
 */

import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useV2Theme } from '../../theme/v2';
import { useDeviceTier } from './hooks/useDeviceTier';

/**
 * @param {{
 *   intensity?: number,
 *   tint?: 'light'|'dark'|'default',
 *   border?: boolean,
 *   radius?: 'none'|'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'full',
 *   padding?: 0|1|2|3|4|5|6|8|10|12|16|20,
 *   style?: any,
 *   children?: any,
 * }} props
 */
export function GlassPanel({
  intensity,
  tint,
  border = true,
  radius = 'xl',
  padding,
  style,
  children,
  ...rest
}) {
  const v2 = useV2Theme();
  const tier = useDeviceTier();
  const resolvedTint = tint ?? v2.palette.glassTint; // 'light' | 'dark'
  const resolvedIntensity = intensity ?? (Platform.OS === 'ios' ? 80 : 60);

  const shellStyle = {
    borderRadius: v2.radius[radius],
    overflow: 'hidden',
    borderWidth: border ? 1 : 0,
    borderColor: v2.palette.border.subtle,
  };
  const padStyle = padding !== undefined ? { padding: v2.spacing[padding] } : null;

  const useBlur =
    Platform.OS === 'ios' || (Platform.OS === 'android' && tier !== 'low');

  if (useBlur) {
    return (
      <BlurView
        {...rest}
        intensity={resolvedIntensity}
        tint={resolvedTint}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={[shellStyle, style]}
      >
        {padStyle ? <View style={padStyle}>{children}</View> : children}
      </BlurView>
    );
  }

  // Fallback — translucent solid using surface tone with reduced alpha.
  const fallbackBg = withAlpha(v2.palette.bg.surface, 0.7);
  return (
    <View {...rest} style={[shellStyle, { backgroundColor: fallbackBg }, padStyle, style]}>
      {children}
    </View>
  );
}

/**
 * Mix a hex color with the given alpha. Accepts #RRGGBB or rgba(...) input.
 */
function withAlpha(color, alpha) {
  if (!color) return `rgba(0,0,0,${alpha})`;
  if (color.startsWith('rgba(')) return color;
  if (color.startsWith('#') && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}

// eslint-disable-next-line no-unused-vars
const _stylesheet = StyleSheet; // keep import for tooling

export default GlassPanel;
