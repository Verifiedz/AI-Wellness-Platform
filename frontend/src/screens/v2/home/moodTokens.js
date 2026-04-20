/**
 * Mood-to-token mapping. Replaces the legacy hardcoded MOOD_COLORS with
 * v2 palette tokens so the mood crystal/chips theme correctly in dark mode.
 *
 * Phosphor icon weights match the legacy Ionicons by intent, not glyph shape.
 */

import { Smiley, Sun, Minus, CloudSnow, CloudRain } from 'phosphor-react-native';

/**
 * @typedef {Object} MoodToken
 * @property {string} id          one of 'great' | 'good' | 'okay' | 'low' | 'tough'
 * @property {string} label
 * @property {React.ComponentType} Icon  Phosphor component
 * @property {(palette: import('../../../theme/v2/palettes').ColorTokens) => string} colorOf
 */

export const MOOD_TOKENS = [
  { id: 'great', label: 'Great', Icon: Smiley,    colorOf: (p) => p.success },
  { id: 'good',  label: 'Good',  Icon: Sun,       colorOf: (p) => p.accent },
  { id: 'okay',  label: 'Okay',  Icon: Minus,     colorOf: (p) => p.warning },
  { id: 'low',   label: 'Low',   Icon: CloudSnow, colorOf: (p) => p.text.tertiary },
  { id: 'tough', label: 'Tough', Icon: CloudRain, colorOf: (p) => p.error },
];

export function getMoodToken(id) {
  return MOOD_TOKENS.find((m) => m.id === id);
}
