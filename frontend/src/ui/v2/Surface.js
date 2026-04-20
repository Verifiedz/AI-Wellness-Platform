/**
 * Non-interactive container with tonal elevation.
 *
 * Usage:
 *   <Surface elevation="raised" padding={4} radius="lg">...</Surface>
 *
 * Elevation tokens (from theme/v2/elevation.js):
 *   flat     — base background, subtle border
 *   raised   — surface, subtle border (default)
 *   high     — surfaceHigh, strong border
 *   elevated — elevated, strong border (highest)
 *
 * No drop shadow by default. Pass `shadow` to opt into pressShadow for special cases.
 */

import React from 'react';
import { View } from 'react-native';
import { useV2Theme, pressShadow } from '../../theme/v2';

/**
 * @param {{
 *   elevation?: 'flat'|'raised'|'high'|'elevated',
 *   padding?: 0|1|2|3|4|5|6|8|10|12|16|20,
 *   paddingX?: 0|1|2|3|4|5|6|8|10|12|16|20,
 *   paddingY?: 0|1|2|3|4|5|6|8|10|12|16|20,
 *   radius?: 'none'|'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'|'full',
 *   border?: boolean,
 *   shadow?: boolean,
 *   style?: any,
 *   children?: any,
 * }} props
 */
export function Surface({
  elevation = 'raised',
  padding,
  paddingX,
  paddingY,
  radius = 'lg',
  border = true,
  shadow = false,
  style,
  children,
  ...rest
}) {
  const v2 = useV2Theme();
  const elev = v2.elevation[elevation] ?? v2.elevation.raised;

  const borderStyles = border
    ? { borderWidth: elev.borderWidth, borderColor: elev.borderColor }
    : { borderWidth: 0 };

  const padTokens = {};
  if (padding !== undefined) padTokens.padding = v2.spacing[padding];
  if (paddingX !== undefined) padTokens.paddingHorizontal = v2.spacing[paddingX];
  if (paddingY !== undefined) padTokens.paddingVertical = v2.spacing[paddingY];

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: elev.backgroundColor,
          borderRadius: v2.radius[radius],
          overflow: 'hidden',
        },
        borderStyles,
        padTokens,
        shadow ? pressShadow : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default Surface;
