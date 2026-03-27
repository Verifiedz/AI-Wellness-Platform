/**
 * Sakina typography scale using DM Sans.
 *
 * Usage:  const { fonts } = useTheme();
 *         <Text style={fonts.heading1}>…</Text>
 */

export const FONT_FAMILY = {
  regular: "DMSans_400Regular",
  medium: "DMSans_500Medium",
  semiBold: "DMSans_600SemiBold",
  bold: "DMSans_700Bold",
};

export const Typography = {
  heading1: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  heading2: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  heading3: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  metric: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 32,
    lineHeight: 38,
  },
};
