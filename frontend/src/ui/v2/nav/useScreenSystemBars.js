/**
 * Per-screen system-bar tinting for Android (status + nav bar icons).
 *
 * Usage inside any screen component:
 *   useScreenSystemBars();          // theme-driven (recommended)
 *   useScreenSystemBars('light');   // force light icons (dark backdrop)
 *   useScreenSystemBars('dark');    // force dark icons (light backdrop)
 *
 * Status bar style is set declaratively at the top of the App tree via
 * <StatusBar /> from expo-status-bar. This hook handles ONLY the Android nav
 * bar (gesture pill / button area) per screen, since iOS doesn't have a nav bar.
 */

import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { useV2Theme } from '../../../theme/v2';

/**
 * @param {'light'|'dark'} [override]
 */
export function useScreenSystemBars(override) {
  const v2 = useV2Theme();

  const apply = useCallback(() => {
    if (Platform.OS !== 'android') return;
    const style = override ?? (v2.isDark ? 'light' : 'dark');
    // setButtonStyleAsync controls the icon color for system buttons.
    NavigationBar.setButtonStyleAsync(style).catch(() => {
      // Older devices / edge cases — silent.
    });
  }, [override, v2.isDark]);

  useFocusEffect(
    useCallback(() => {
      apply();
      return () => {
        // No teardown — next focused screen will set its own style.
      };
    }, [apply])
  );
}

export default useScreenSystemBars;
