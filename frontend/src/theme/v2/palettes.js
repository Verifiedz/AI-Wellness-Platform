/**
 * Sakina v2 palettes — Midnight Aurora (dark) + Sage Mist (light).
 * Source of truth defined in docs/redesign/01-aesthetic-research.md §4.1, §4.2.
 *
 * Naming convention is semantic, not literal — consumers reference by role
 * (bg.base, text.primary, accent) so a future palette swap is a one-line change.
 */

/**
 * @typedef {Object} ColorTokens
 * @property {{ base: string, surface: string, surfaceHigh: string, elevated: string }} bg
 * @property {{ primary: string, secondary: string, tertiary: string, onPrimary: string, onAccent: string }} text
 * @property {string} primary
 * @property {string} primaryHover
 * @property {string} accent
 * @property {string} accentGlow
 * @property {string} secondary
 * @property {string} success
 * @property {string} warning
 * @property {string} error
 * @property {{ subtle: string, strong: string }} border
 * @property {string} scrim
 * @property {string} glassTint
 */

/** @type {ColorTokens} */
export const MIDNIGHT_AURORA = {
  bg: {
    base: '#0B0F1A',
    surface: '#141A2A',
    surfaceHigh: '#1D2438',
    elevated: '#262E47',
  },
  text: {
    primary: '#EEF1FA',
    secondary: '#A6B0C8',
    tertiary: '#6E788F',
    onPrimary: '#0E1426',
    onAccent: '#0B1A18',
  },
  primary: '#7A95FF',
  primaryHover: '#94ACFF',
  accent: '#5AF0DA',
  accentGlow: 'rgba(90, 240, 218, 0.55)',
  secondary: '#B6ACFF',
  success: '#5BD9A8',
  warning: '#F2C566',
  error: '#FF8576',
  border: {
    subtle: '#252B3F',
    strong: '#3A4258',
  },
  scrim: 'rgba(0, 0, 0, 0.55)',
  glassTint: 'dark',
};

/** @type {ColorTokens} */
export const SAGE_MIST = {
  bg: {
    base: '#F5F4EE',
    surface: '#FFFFFF',
    surfaceHigh: '#EDEBE0',
    elevated: '#FFFFFF',
  },
  text: {
    primary: '#1A211E',
    secondary: '#4F5751',
    // tertiary darkened from #7A8079 to clear WCAG AA contrast (4.5:1) on white at 12px.
    tertiary: '#6B716A',
    onPrimary: '#FFFFFF',
    onAccent: '#1A211E',
  },
  primary: '#5E8C6A',
  primaryHover: '#4A7456',
  accent: '#D9914A',
  accentGlow: 'rgba(217, 145, 74, 0.30)',
  secondary: '#B96D52',
  success: '#5E8C6A',
  warning: '#D9A24A',
  error: '#C4524A',
  border: {
    subtle: '#DEDCD0',
    strong: '#BDBBA9',
  },
  scrim: 'rgba(20, 24, 22, 0.40)',
  glassTint: 'light',
};

/**
 * @param {boolean} isDark
 * @returns {ColorTokens}
 */
export function getPalette(isDark) {
  return isDark ? MIDNIGHT_AURORA : SAGE_MIST;
}
