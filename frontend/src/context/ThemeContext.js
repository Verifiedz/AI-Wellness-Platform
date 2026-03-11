import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkColors, LightColors } from "../theme/colors";

const ThemeContext = createContext(null);
const THEME_MODE_KEY = "theme_mode_v1";

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const value = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (value === "dark") setIsDarkMode(true);
      } catch (error) {
        console.warn("Failed to restore theme mode:", error);
      } finally {
        setIsThemeReady(true);
      }
    })();
  }, []);

  const setDarkMode = useCallback(async (enabled) => {
    setIsDarkMode(enabled);
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, enabled ? "dark" : "light");
    } catch (error) {
      console.warn("Failed to persist theme mode:", error);
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!isDarkMode);
  }, [isDarkMode, setDarkMode]);

  const colors = useMemo(
    () => (isDarkMode ? DarkColors : LightColors),
    [isDarkMode]
  );

  const value = useMemo(
    () => ({
      isDarkMode,
      isThemeReady,
      colors,
      setDarkMode,
      toggleDarkMode,
    }),
    [colors, isDarkMode, isThemeReady, setDarkMode, toggleDarkMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
