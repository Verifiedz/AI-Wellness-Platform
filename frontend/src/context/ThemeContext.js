import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Appearance, LayoutAnimation } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { useTimeOfDay } from '../hooks/useTimeOfDay';
import { DEFAULT_ACCENT_ID, getAccentById } from '../theme/accents';

const ThemeContext = createContext(null);
const THEME_MODE_KEY = 'theme_mode_v1';
const DYNAMIC_THEME_KEY = 'dynamic_theme_v1';
const ACCENT_ID_KEY = 'accent_id_v1';

/**
 * Resolves the final color palette by layering:
 *   1. Base palette (light/dark)
 *   2. Time-of-day overrides (if dynamic theme enabled)
 *   3. Accent color overrides
 *
 * Each layer only overrides the keys it defines.
 */
function resolveColors(isDark, isDynamicTheme, timeOverrides, accentId) {
  const base = isDark ? { ...DarkColors } : { ...LightColors };

  // Layer 2: time-of-day
  if (isDynamicTheme && timeOverrides) {
    const todOverrides = isDark ? timeOverrides.dark : timeOverrides.light;
    Object.assign(base, todOverrides);
  }

  // Layer 3: accent
  const accent = getAccentById(accentId);
  if (accent) {
    const accentOverrides = isDark ? accent.dark : accent.light;
    Object.assign(base, accentOverrides);
  }

  return base;
}

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDynamicTheme, setIsDynamicThemeState] = useState(true);
  const [accentId, setAccentIdState] = useState(DEFAULT_ACCENT_ID);
  const [isThemeReady, setIsThemeReady] = useState(false);

  // true while the user has no explicit preference — system scheme changes are respected
  const isSystemManaged = useRef(false);

  const { period, overrides: timeOverrides } = useTimeOfDay();

  useEffect(() => {
    (async () => {
      try {
        const [modeVal, dynamicVal, accentVal] = await Promise.all([
          AsyncStorage.getItem(THEME_MODE_KEY),
          AsyncStorage.getItem(DYNAMIC_THEME_KEY),
          AsyncStorage.getItem(ACCENT_ID_KEY),
        ]);

        if (modeVal !== null) {
          // User has an explicit saved preference — honour it
          if (modeVal === 'dark') setIsDarkMode(true);
        } else {
          // First launch or cleared preference — follow system color scheme
          isSystemManaged.current = true;
          setIsDarkMode(Appearance.getColorScheme() === 'dark');
        }

        if (dynamicVal !== null) setIsDynamicThemeState(dynamicVal === 'true');
        if (accentVal) setAccentIdState(accentVal);
      } catch {
        // Theme restore failed — use defaults
      } finally {
        setIsThemeReady(true);
      }
    })();
  }, []);

  // Mirror system theme changes while no explicit preference is set
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (isSystemManaged.current) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsDarkMode(colorScheme === 'dark');
      }
    });
    return () => subscription.remove();
  }, []);

  const setDarkMode = useCallback(async (enabled) => {
    // An explicit call always locks in the user's preference
    isSystemManaged.current = false;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDarkMode(enabled);
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, enabled ? 'dark' : 'light');
    } catch {
      // Theme persist failed — non-critical
    }
  }, []);

  /**
   * Clears the persisted preference and reverts to following the system scheme.
   * Useful for a "Use System Default" settings option.
   */
  const resetToSystemTheme = useCallback(async () => {
    isSystemManaged.current = true;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDarkMode(Appearance.getColorScheme() === 'dark');
    try {
      await AsyncStorage.removeItem(THEME_MODE_KEY);
    } catch {
      // Non-critical
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!isDarkMode);
  }, [isDarkMode, setDarkMode]);

  const setDynamicTheme = useCallback(async (enabled) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDynamicThemeState(enabled);
    try {
      await AsyncStorage.setItem(DYNAMIC_THEME_KEY, String(enabled));
    } catch {
      // Persist failed — non-critical
    }
  }, []);

  const setAccentId = useCallback(async (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAccentIdState(id);
    try {
      await AsyncStorage.setItem(ACCENT_ID_KEY, id);
    } catch {
      // Persist failed — non-critical
    }
  }, []);

  const colors = useMemo(
    () => resolveColors(isDarkMode, isDynamicTheme, timeOverrides, accentId),
    [isDarkMode, isDynamicTheme, timeOverrides, accentId]
  );

  const fonts = useMemo(() => Typography, []);

  const value = useMemo(
    () => ({
      isDarkMode,
      isDynamicTheme,
      accentId,
      timePeriod: period,
      isThemeReady,
      colors,
      fonts,
      setDarkMode,
      toggleDarkMode,
      setDynamicTheme,
      setAccentId,
      resetToSystemTheme,
    }),
    [
      colors,
      fonts,
      isDarkMode,
      isDynamicTheme,
      accentId,
      period,
      isThemeReady,
      setDarkMode,
      toggleDarkMode,
      setDynamicTheme,
      setAccentId,
      resetToSystemTheme,
    ]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
