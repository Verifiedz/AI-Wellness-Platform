/**
 * Sakina brand mark — lotus bloom cradled by two calm leaves.
 *
 * Visual: a five-petal lotus flower (tranquility, mindfulness, wellness)
 * resting on two gentle leaves. Pure SVG so it scales crisply on every
 * device, never depends on a raster asset, and respects theme colors.
 *
 * The flower signals calm + growth; the two leaves echo the supportive
 * companionship the app aims to offer.
 */

import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
  Circle,
} from 'react-native-svg';
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
  const primary = color ?? v2.palette.primary;
  const petalAccent = accent ?? v2.palette.accent;

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
        <LinearGradient id="sakina-petal" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={petalAccent} stopOpacity="0.95" />
          <Stop offset="1" stopColor={primary} stopOpacity="1" />
        </LinearGradient>
        <LinearGradient id="sakina-leaf" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={primary} stopOpacity="0.55" />
          <Stop offset="1" stopColor={primary} stopOpacity="0.85" />
        </LinearGradient>
        <LinearGradient id="sakina-center-petal" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={petalAccent} stopOpacity="1" />
          <Stop offset="1" stopColor={petalAccent} stopOpacity="0.75" />
        </LinearGradient>
      </Defs>

      {/* Two cradling leaves */}
      <Path
        d="M18 64 C24 52, 38 50, 48 58 C40 64, 28 66, 18 64 Z"
        fill="url(#sakina-leaf)"
      />
      <Path
        d="M78 64 C72 52, 58 50, 48 58 C56 64, 68 66, 78 64 Z"
        fill="url(#sakina-leaf)"
      />

      {/* Side petals (outer, more translucent) */}
      <Path
        d="M48 58 C30 58, 22 42, 26 28 C38 30, 48 42, 48 58 Z"
        fill="url(#sakina-petal)"
        opacity="0.8"
      />
      <Path
        d="M48 58 C66 58, 74 42, 70 28 C58 30, 48 42, 48 58 Z"
        fill="url(#sakina-petal)"
        opacity="0.8"
      />

      {/* Mid petals */}
      <Path
        d="M48 58 C38 54, 34 38, 40 22 C48 28, 52 42, 48 58 Z"
        fill="url(#sakina-petal)"
        opacity="0.92"
      />
      <Path
        d="M48 58 C58 54, 62 38, 56 22 C48 28, 44 42, 48 58 Z"
        fill="url(#sakina-petal)"
        opacity="0.92"
      />

      {/* Center petal (tallest, most saturated) */}
      <Path
        d="M48 58 C44 48, 44 30, 48 16 C52 30, 52 48, 48 58 Z"
        fill="url(#sakina-center-petal)"
      />

      {/* Calm dot at heart of bloom */}
      <Circle cx="48" cy="56" r="3" fill={primary} />
    </Svg>
  );
}

export default SakinaLogo;
