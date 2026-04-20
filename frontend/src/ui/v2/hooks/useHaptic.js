/**
 * Haptic choreography wrapper. Use intent tokens, never the raw expo-haptics API.
 *
 * Usage:
 *   const haptic = useHaptic();
 *   haptic('firm');                  // Haptics.impactAsync(Medium)
 *   haptic('success');               // Haptics.notificationAsync(Success)
 *
 * Intents (from theme/v2/motion.js):
 *   tap     — small button press, toggle
 *   soft    — message sent, breath inhale
 *   firm    — bookmark, save, complete
 *   strong  — confirmation, milestone
 *   success — success toast
 *   warn    — validation error
 *   error   — API error
 */

import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from './useReducedMotion';

/**
 * @typedef {'tap'|'soft'|'firm'|'strong'|'success'|'warn'|'error'} HapticIntent
 */

const INTENT_TO_API = {
  tap: () => Haptics.selectionAsync(),
  soft: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  firm: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  strong: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

/**
 * @returns {(intent: HapticIntent) => void}
 */
export function useHaptic() {
  const reduced = useReducedMotion();

  return useCallback(
    (intent) => {
      // Web has no usable haptic; bail.
      if (Platform.OS === 'web') return;
      // Honour reduce-motion: keep success/warn/error (informative), drop the rest.
      if (reduced && !['success', 'warn', 'error'].includes(intent)) return;

      const fn = INTENT_TO_API[intent];
      if (!fn) return;

      // Fire and forget — never block on haptic.
      fn().catch(() => {
        // Silent: some devices/conditions (Low Power Mode) silently no-op.
      });
    },
    [reduced]
  );
}
