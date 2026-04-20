/**
 * Motion tokens — durations + easing. Used everywhere from Moti to Reanimated.
 */

export const duration = Object.freeze({
  micro: 150,    // tap feedback, ripple
  fast: 200,     // toggles, chevron rotates
  normal: 280,   // sheet/modal open, tab change
  slow: 400,     // card expand
  screen: 480,   // stack push/pop
  hero: 700,     // post-completion bloom
  ambient: 6000, // generative background drift
  breath: 4000,  // breathing pulse cycle
});

/**
 * Cubic-bezier easings. For Reanimated, pass to Easing.bezier(...).
 * For Moti / CSS, use the array form directly.
 */
export const easing = Object.freeze({
  default: [0.22, 1, 0.36, 1],   // ease-out cubic
  in: [0.4, 0, 1, 1],
  inOut: [0.4, 0, 0.2, 1],
  breath: [0.4, 0, 0.4, 1],
});

export const spring = Object.freeze({
  default: { stiffness: 180, damping: 22, mass: 1 },
  snap: { stiffness: 300, damping: 20, mass: 1 },
  gentle: { stiffness: 100, damping: 18, mass: 1 },
});

/**
 * Haptic intent tokens. The actual API call lives in the useHaptic() wrapper.
 */
export const haptic = Object.freeze({
  tap: 'selection',
  soft: 'impactLight',
  firm: 'impactMedium',
  strong: 'impactHeavy',
  success: 'notificationSuccess',
  warn: 'notificationWarning',
  error: 'notificationError',
});
