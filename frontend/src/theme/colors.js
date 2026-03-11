/**
 * Centralized color palettes for light/dark themes.
 */
export const LightColors = {
  primary: "#4A90D9",
  primaryDark: "#357ABD",
  primaryLight: "#7BB3E0",

  secondary: "#6C5CE7",
  accent: "#00CEC9",

  background: "#F8F9FA",
  surface: "#FFFFFF",

  text: "#2D3436",
  textSecondary: "#636E72",
  textLight: "#B2BEC3",

  border: "#DFE6E9",

  error: "#E74C3C",
  success: "#00B894",
  warning: "#FDCB6E",

  disabled: "#B2BEC3",
  overlay: "rgba(0,0,0,0.5)",
};

export const DarkColors = {
  primary: "#5A9FE6",
  primaryDark: "#3A7FC6",
  primaryLight: "#8CBDED",

  secondary: "#8C7BFF",
  accent: "#27D8D2",

  background: "#0F141A",
  surface: "#1A232D",

  text: "#E6EDF3",
  textSecondary: "#B3C1CF",
  textLight: "#7E8C99",

  border: "#2C3A47",

  error: "#FF7B72",
  success: "#3FB950",
  warning: "#E3B341",

  disabled: "#586069",
  overlay: "rgba(0,0,0,0.65)",
};

/**
 * Backwards compatibility for screens that still import Colors directly.
 * New code should prefer useTheme() and `colors`.
 */
export const Colors = LightColors;
