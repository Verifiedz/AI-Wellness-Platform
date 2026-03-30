/**
 * Dynamic time-of-day color overrides for the Sakina theme system.
 *
 * Three periods: Morning (6am–12pm), Afternoon (12pm–6pm), Evening (6pm–6am).
 * Each period can override specific color keys for both light and dark modes.
 * Afternoon uses the base Warm Sanctuary palette with no overrides.
 */

export const TIME_PERIODS = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
};

/**
 * Returns the current time period based on the hour.
 * @param {Date} [date] - optional date, defaults to now
 * @returns {"morning"|"afternoon"|"evening"}
 */
export function getTimePeriod(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return TIME_PERIODS.MORNING;
  if (hour >= 12 && hour < 18) return TIME_PERIODS.AFTERNOON;
  return TIME_PERIODS.EVENING;
}

/**
 * Color overrides per period. Only keys that differ from the base palette
 * are included — the ThemeContext merges these on top of the base.
 */
export const TIME_OF_DAY_OVERRIDES = {
  [TIME_PERIODS.MORNING]: {
    light: {
      background: '#FFF8F0',
      accent: '#D4956A',
      secondary: '#D4956A',
    },
    dark: {
      background: '#1D1A18',
      accent: '#D4A87A',
      secondary: '#D4A87A',
    },
  },
  [TIME_PERIODS.AFTERNOON]: {
    light: {},
    dark: {},
  },
  [TIME_PERIODS.EVENING]: {
    light: {
      background: '#F5F5FA',
      accent: '#7C7CB2',
      secondary: '#9B8EC4',
    },
    dark: {
      background: '#18191F',
      accent: '#8B8BC8',
      secondary: '#A89DD4',
    },
  },
};

/**
 * Returns the greeting icon name for the current time period.
 * @param {string} period
 * @returns {string} Ionicons icon name
 */
export function getTimePeriodIcon(period) {
  switch (period) {
    case TIME_PERIODS.MORNING:
      return 'sunny-outline';
    case TIME_PERIODS.AFTERNOON:
      return 'partly-sunny-outline';
    case TIME_PERIODS.EVENING:
      return 'moon-outline';
    default:
      return 'partly-sunny-outline';
  }
}
