/**
 * 4pt spacing grid. Use named tokens, not magic numbers.
 *
 * Usage:  padding: spacing[4]   // 16px
 */
export const spacing = Object.freeze({
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
});

export const radius = Object.freeze({
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
});

export const hitSlop = Object.freeze({ top: 8, bottom: 8, left: 8, right: 8 });

export const TOUCH_TARGET_MIN = 48;
