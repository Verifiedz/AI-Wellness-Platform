import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/**
 * Tablet breakpoint: shortest screen dimension exceeds 600px.
 * This catches both portrait and landscape orientations on tablets
 * while excluding large phones (which typically max out around 430px shortest side).
 */
const TABLET_SHORTEST_DIMENSION = 600;

/** Maximum content width on tablets to prevent overly wide layouts. */
const TABLET_MAX_CONTENT_WIDTH = 680;

/**
 * Returns reactive layout information based on current window dimensions.
 *
 * On phones the returned values are essentially no-ops:
 *   - isTablet = false
 *   - isLandscape = false (usually)
 *   - contentMaxWidth = screenWidth
 *   - horizontalPadding = 0
 *
 * On tablets the hook caps content width and calculates centering padding.
 *
 * @returns {{
 *   isTablet: boolean,
 *   isLandscape: boolean,
 *   screenWidth: number,
 *   screenHeight: number,
 *   contentMaxWidth: number,
 *   horizontalPadding: number,
 * }}
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const shortestDimension = Math.min(width, height);
    const isTablet = shortestDimension >= TABLET_SHORTEST_DIMENSION;
    const isLandscape = width > height;

    const contentMaxWidth = isTablet
      ? Math.min(TABLET_MAX_CONTENT_WIDTH, width)
      : width;

    const horizontalPadding = isTablet
      ? Math.max(0, (width - contentMaxWidth) / 2)
      : 0;

    return {
      isTablet,
      isLandscape,
      screenWidth: width,
      screenHeight: height,
      contentMaxWidth,
      horizontalPadding,
    };
  }, [width, height]);
}
