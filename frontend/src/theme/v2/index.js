/**
 * Sakina v2 design tokens — public API.
 *
 * Usage:
 *   import { useV2Theme } from '../theme/v2';
 *   const { palette, spacing, radius, type, motion } = useV2Theme();
 *
 * The hook composes with the existing useTheme() so dark/light + accent picker
 * decisions made in ThemeContext flow into v2 tokens automatically.
 */

import { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getPalette } from './palettes';
import { spacing, radius, TOUCH_TARGET_MIN, hitSlop as hitSlopTokens } from './spacing';
import { duration, easing, spring, haptic } from './motion';
import { getTextStyle } from './typography';
import { getElevation, pressShadow } from './elevation';

export { MIDNIGHT_AURORA, SAGE_MIST, getPalette } from './palettes';
export { spacing, radius, hitSlop, TOUCH_TARGET_MIN } from './spacing';
export { duration, easing, spring, haptic } from './motion';
export { getTextStyle, TEXT_VARIANTS, FONT_FAMILY } from './typography';
export { getElevation, pressShadow } from './elevation';

/**
 * @typedef {Object} V2Theme
 * @property {import('./palettes').ColorTokens} palette
 * @property {boolean} isDark
 * @property {typeof spacing} spacing
 * @property {typeof radius} radius
 * @property {{ duration: typeof duration, easing: typeof easing, spring: typeof spring, haptic: typeof haptic }} motion
 * @property {(variant: string) => object} type
 * @property {object} elevation
 * @property {object} pressShadow
 * @property {object} hitSlop
 * @property {number} touchTargetMin
 */

/**
 * @returns {V2Theme}
 */
export function useV2Theme() {
  const { isDarkMode, colors: legacyColors } = useTheme();

  return useMemo(() => {
    const basePalette = getPalette(isDarkMode);

    // Merge: accent from legacy theme overrides v2 default if user picked a custom accent.
    // legacyColors.primary is the user's chosen accent (sage, ocean, sunset, lavender, rose, forest).
    const palette = {
      ...basePalette,
      // Honour user accent picker — keep brand glow tied to their selection.
      // Falls back to base aurora cyan if legacy accent not set.
      ...(legacyColors?.primary ? { primary: legacyColors.primary } : {}),
    };

    return {
      palette,
      isDark: isDarkMode,
      spacing,
      radius,
      motion: { duration, easing, spring, haptic },
      type: getTextStyle,
      elevation: getElevation(palette),
      pressShadow,
      hitSlop: hitSlopTokens,
      touchTargetMin: TOUCH_TARGET_MIN,
    };
  }, [isDarkMode, legacyColors]);
}
