/**
 * Coarse device-tier gating for expensive effects (Skia particles,
 * Dimezis blur on Android). Returns 'high' | 'medium' | 'low'.
 *
 * Heuristic: iOS = high, web = high, Android API < 31 = low, otherwise medium.
 * Refine later if real-world perf flags warrant.
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';

/** @returns {'high' | 'medium' | 'low'} */
export function useDeviceTier() {
  if (Platform.OS === 'ios') return 'high';
  if (Platform.OS === 'web') return 'high';
  if (Platform.OS === 'android') {
    const api = Device.platformApiLevel ?? 0;
    if (api < 31) return 'low';
    return 'medium';
  }
  return 'medium';
}
