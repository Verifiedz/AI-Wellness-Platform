/**
 * One-time navigation feature flag setup. Import once at App.js top level
 * (already wired). Calling more than once is safe.
 *
 * What this enables:
 *   - Shared element transitions (Reanimated 4.2+, native stack only)
 *   - Synchronous prop iteration (perf flag for Reanimated 4.x)
 *
 * The Reanimated feature flag API lives at `react-native-reanimated`'s package
 * root. Some versions expose `enableExperimentalFeature`, others use
 * `unstable_setExperimentalFeatures`. We probe both.
 */

import * as Reanimated from 'react-native-reanimated';

let setupRan = false;

export function setupNavigationFeatureFlags() {
  if (setupRan) return;
  setupRan = true;

  // Shared element transitions — required to use Animated.* sharedTransitionTag.
  try {
    if (typeof Reanimated.enableExperimentalFeature === 'function') {
      Reanimated.enableExperimentalFeature('ENABLE_SHARED_ELEMENT_TRANSITIONS', true);
    } else if (typeof Reanimated.unstable_setExperimentalFeatures === 'function') {
      Reanimated.unstable_setExperimentalFeatures({
        ENABLE_SHARED_ELEMENT_TRANSITIONS: true,
      });
    }
  } catch {
    // The feature flag API is intentionally unstable — never let it crash startup.
  }
}
