/**
 * Shared scroll-progress context.
 *
 * ScreenScaffold writes the current scroll Y of the visible scrollable to
 * `scrollY` (a Reanimated SharedValue). The TabBar reads it to shrink/elevate
 * itself as content scrolls under it.
 *
 * The context lives at the App root so any screen can publish, and the tab bar
 * can subscribe without prop-drilling. When no provider is mounted (e.g., dev
 * preview surfaces), `useScrollProgress()` returns a no-op shared value.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useSharedValue } from 'react-native-reanimated';

const ScrollProgressContext = createContext(null);

export function ScrollProgressProvider({ children }) {
  const scrollY = useSharedValue(0);
  const value = useMemo(() => ({ scrollY }), [scrollY]);
  return (
    <ScrollProgressContext.Provider value={value}>{children}</ScrollProgressContext.Provider>
  );
}

/**
 * Returns `{ scrollY }` — a Reanimated SharedValue. Always defined; falls back
 * to a local SharedValue when no provider is mounted so consumers don't crash
 * in test surfaces.
 */
export function useScrollProgress() {
  const ctx = useContext(ScrollProgressContext);
  const fallback = useSharedValue(0);
  return ctx ?? { scrollY: fallback };
}

export default ScrollProgressContext;
