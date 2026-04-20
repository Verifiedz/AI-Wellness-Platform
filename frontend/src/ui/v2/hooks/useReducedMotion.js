/**
 * Tracks the system "reduce motion" preference.
 * Every ambient animation in v2 must gate on this hook.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * @returns {boolean} true if the user has enabled "reduce motion" at the OS level.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (mounted) setReduced(Boolean(v));
      })
      .catch(() => {
        // Some platforms reject; treat as false.
      });

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      setReduced(Boolean(v));
    });

    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  return reduced;
}
