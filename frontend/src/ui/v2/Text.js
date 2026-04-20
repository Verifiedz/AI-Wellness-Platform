/**
 * Themed Text — variant-driven, color-token-driven.
 *
 * Usage:
 *   <Text variant="h1">Today</Text>
 *   <Text variant="body" color="secondary" numberOfLines={2}>...</Text>
 *
 * Defaults:
 *   - color = palette.text.primary
 *   - allowFontScaling = true with maxFontSizeMultiplier = 1.4 to prevent layout breaks at huge type
 */

import React from 'react';
import { Text as RNText } from 'react-native';
import { useV2Theme } from '../../theme/v2';

const COLOR_PATHS = {
  primary: (p) => p.text.primary,
  secondary: (p) => p.text.secondary,
  tertiary: (p) => p.text.tertiary,
  onPrimary: (p) => p.text.onPrimary,
  onAccent: (p) => p.text.onAccent,
  accent: (p) => p.accent,
  success: (p) => p.success,
  warning: (p) => p.warning,
  error: (p) => p.error,
};

/**
 * @param {{
 *   variant?: 'display-xl'|'display-lg'|'h1'|'h2'|'h3'|'body-lg'|'body'|'body-sm'|'caption'|'label'|'mono',
 *   color?: 'primary'|'secondary'|'tertiary'|'onPrimary'|'onAccent'|'accent'|'success'|'warning'|'error',
 *   align?: 'left'|'center'|'right',
 *   numberOfLines?: number,
 *   style?: any,
 *   children?: any,
 * } & import('react-native').TextProps} props
 */
export function Text({
  variant = 'body',
  color = 'primary',
  align = 'left',
  numberOfLines,
  style,
  children,
  maxFontSizeMultiplier = 1.4,
  ...rest
}) {
  const { palette, type } = useV2Theme();
  const resolvedColor = (COLOR_PATHS[color] ?? COLOR_PATHS.primary)(palette);

  return (
    <RNText
      {...rest}
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[type(variant), { color: resolvedColor, textAlign: align }, style]}
    >
      {children}
    </RNText>
  );
}

export default Text;
