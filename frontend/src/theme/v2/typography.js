/**
 * "Modern Mindful" type scale — DM Serif Display (display) + DM Sans (UI).
 * JetBrains Mono for technical labels (timer, BPM, code).
 *
 * Each variant resolves to a React Native style object via getTextStyle(variant).
 */

export const FONT_FAMILY = Object.freeze({
  serifDisplay: 'DMSerifDisplay_400Regular',
  sans400: 'DMSans_400Regular',
  sans500: 'DMSans_500Medium',
  sans600: 'DMSans_600SemiBold',
  sans700: 'DMSans_700Bold',
  mono: 'JetBrainsMono_400Regular',
});

/**
 * @typedef {'display-xl'|'display-lg'|'h1'|'h2'|'h3'|'body-lg'|'body'|'body-sm'|'caption'|'label'|'mono'} TypeVariant
 */

const SCALE = {
  'display-xl': {
    fontFamily: FONT_FAMILY.serifDisplay,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -0.56,
  },
  'display-lg': {
    fontFamily: FONT_FAMILY.serifDisplay,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.2,
  },
  h1: {
    fontFamily: FONT_FAMILY.sans700,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.14,
  },
  h2: {
    fontFamily: FONT_FAMILY.sans600,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
  },
  h3: {
    fontFamily: FONT_FAMILY.sans600,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  'body-lg': {
    fontFamily: FONT_FAMILY.sans400,
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
  },
  body: {
    fontFamily: FONT_FAMILY.sans400,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
  },
  'body-sm': {
    fontFamily: FONT_FAMILY.sans400,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.065,
  },
  caption: {
    fontFamily: FONT_FAMILY.sans500,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
  },
  label: {
    fontFamily: FONT_FAMILY.sans600,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.44,
    textTransform: 'uppercase',
  },
  mono: {
    fontFamily: FONT_FAMILY.mono,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0,
  },
};

/**
 * @param {TypeVariant} variant
 * @returns {object}
 */
export function getTextStyle(variant) {
  return SCALE[variant] || SCALE.body;
}

export const TEXT_VARIANTS = Object.freeze(Object.keys(SCALE));
