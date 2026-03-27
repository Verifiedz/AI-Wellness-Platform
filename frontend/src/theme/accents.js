/**
 * Accent color presets for Sakina theme customization.
 *
 * Each preset provides primary/primaryDark/primaryLight overrides
 * for both light and dark modes. The ThemeContext applies these
 * on top of the base + time-of-day colors.
 */

export const ACCENT_PRESETS = [
  {
    id: "sage",
    name: "Sage",
    swatch: "#5B7F6E",
    light: { primary: "#5B7F6E", primaryDark: "#4A6B5C", primaryLight: "#8FB5A3" },
    dark: { primary: "#7BA893", primaryDark: "#5B8A73", primaryLight: "#A3CCBA" },
  },
  {
    id: "ocean",
    name: "Ocean",
    swatch: "#4A7FA5",
    light: { primary: "#4A7FA5", primaryDark: "#3B6A8C", primaryLight: "#7BB0CC" },
    dark: { primary: "#6BA3C8", primaryDark: "#4A8AB2", primaryLight: "#95C4DD" },
  },
  {
    id: "sunset",
    name: "Sunset",
    swatch: "#C4726A",
    light: { primary: "#C4726A", primaryDark: "#A85E57", primaryLight: "#D9A09A" },
    dark: { primary: "#D4918A", primaryDark: "#C4726A", primaryLight: "#E5B5B0" },
  },
  {
    id: "lavender",
    name: "Lavender",
    swatch: "#8B7EB8",
    light: { primary: "#8B7EB8", primaryDark: "#7568A0", primaryLight: "#B0A6D0" },
    dark: { primary: "#A498CC", primaryDark: "#8B7EB8", primaryLight: "#C4BBDD" },
  },
  {
    id: "rose",
    name: "Rose",
    swatch: "#B5708A",
    light: { primary: "#B5708A", primaryDark: "#995F76", primaryLight: "#D0A0B4" },
    dark: { primary: "#CC8FA5", primaryDark: "#B5708A", primaryLight: "#DDB4C4" },
  },
  {
    id: "forest",
    name: "Forest",
    swatch: "#4A7A5A",
    light: { primary: "#4A7A5A", primaryDark: "#3D664B", primaryLight: "#7BAA8A" },
    dark: { primary: "#6BA07A", primaryDark: "#4A7A5A", primaryLight: "#95C4A5" },
  },
];

export const DEFAULT_ACCENT_ID = "sage";

/**
 * Find an accent preset by ID.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getAccentById(id) {
  return ACCENT_PRESETS.find((a) => a.id === id);
}
