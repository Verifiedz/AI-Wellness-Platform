import { Platform } from "react-native";
import { useCallback, useRef } from "react";

/**
 * Platform-safe haptic feedback hook.
 * Lazy-loads expo-haptics only on native platforms; no-ops on web and
 * gracefully handles devices where haptics are unavailable.
 */
export function useHaptic() {
  const hapticsRef = useRef(null);
  const loadedRef = useRef(false);

  const getHaptics = useCallback(() => {
    if (Platform.OS === "web") return null;
    if (loadedRef.current) return hapticsRef.current;
    try {
      hapticsRef.current = require("expo-haptics");
    } catch {
      hapticsRef.current = null;
    }
    loadedRef.current = true;
    return hapticsRef.current;
  }, []);

  const triggerSelection = useCallback(() => {
    const haptics = getHaptics();
    if (!haptics) return;
    try {
      haptics.selectionAsync();
    } catch {
      // Device does not support haptics — silently ignore
    }
  }, [getHaptics]);

  const triggerImpact = useCallback(
    (style = "Light") => {
      const haptics = getHaptics();
      if (!haptics) return;
      try {
        haptics.impactAsync(haptics.ImpactFeedbackStyle[style]);
      } catch {
        // Unsupported — silently ignore
      }
    },
    [getHaptics],
  );

  const triggerNotification = useCallback(
    (type = "Success") => {
      const haptics = getHaptics();
      if (!haptics) return;
      try {
        haptics.notificationAsync(haptics.NotificationFeedbackType[type]);
      } catch {
        // Unsupported — silently ignore
      }
    },
    [getHaptics],
  );

  return { triggerSelection, triggerImpact, triggerNotification };
}
