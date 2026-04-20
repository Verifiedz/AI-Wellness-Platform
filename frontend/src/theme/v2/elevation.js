/**
 * Elevation — tonal, not box-shadow.
 * Premium UIs convey depth through translucency + tonal surface shifts, not drop shadows.
 *
 * For the rare cases a true shadow is required (e.g., bento card press lift),
 * `pressShadow` is provided — never used as the *primary* elevation cue.
 */

import { Platform } from 'react-native';

/**
 * @param {import('./palettes').ColorTokens} palette
 * @returns {object}
 */
export function getElevation(palette) {
  return {
    flat: {
      backgroundColor: palette.bg.base,
      borderWidth: 1,
      borderColor: palette.border.subtle,
    },
    raised: {
      backgroundColor: palette.bg.surface,
      borderWidth: 1,
      borderColor: palette.border.subtle,
    },
    high: {
      backgroundColor: palette.bg.surfaceHigh,
      borderWidth: 1,
      borderColor: palette.border.strong,
    },
    elevated: {
      backgroundColor: palette.bg.elevated,
      borderWidth: 1,
      borderColor: palette.border.strong,
    },
  };
}

/**
 * Optional press shadow for interactive Bento cards.
 * Used sparingly. Tonal elevation is preferred.
 */
export const pressShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  android: {
    elevation: 6,
  },
  default: {
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.18)',
  },
});
