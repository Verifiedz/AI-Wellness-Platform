/**
 * Sakina brand mark — three concentric breath rings around a calm dot.
 *
 * Pure SVG so it scales crisply on every device, never depends on a raster
 * asset being shipped, and stays single-color (theme-aware).
 *
 * The rings echo the breathing exercise; the inner dot is the present moment.
 */

import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useV2Theme } from '../../theme/v2';

/**
 * @param {{
 *   size?: number,
 *   color?: string,
 *   accent?: string,
 *   style?: any,
 * }} props
 */
export function SakinaLogo({ size = 96, color, accent, style }) {
  const v2 = useV2Theme();
  const ringColor = color ?? v2.palette.primary;
  const dotColor = accent ?? v2.palette.accent;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      style={style}
      accessibilityRole="image"
      accessibilityLabel="Sakina"
    >
      <Defs>
        <LinearGradient id="sakina-ring" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={ringColor} stopOpacity="1" />
          <Stop offset="1" stopColor={dotColor} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Circle cx="48" cy="48" r="44" stroke={ringColor} strokeOpacity="0.25" strokeWidth="2" fill="none" />
      <Circle cx="48" cy="48" r="32" stroke={ringColor} strokeOpacity="0.45" strokeWidth="2" fill="none" />
      <Circle cx="48" cy="48" r="20" stroke="url(#sakina-ring)" strokeWidth="2.5" fill="none" />
      <Circle cx="48" cy="48" r="8" fill={dotColor} />
    </Svg>
  );
}

export default SakinaLogo;
