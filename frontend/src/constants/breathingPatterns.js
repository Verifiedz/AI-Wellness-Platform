/**
 * Breathing pattern definitions for the BreathingExerciseScreen.
 *
 * Each pattern defines phase durations in milliseconds.
 * hold2Ms is the optional second hold (used in box breathing).
 */
export const BREATHING_PATTERNS = [
  {
    id: 'calm',
    label: 'Calm',
    description: 'A gentle rhythm to ease tension',
    inhaleMs: 4000,
    holdMs: 2000,
    exhaleMs: 6000,
    hold2Ms: 0,
  },
  {
    id: 'box',
    label: 'Box',
    description: 'Equal phases for steady focus',
    inhaleMs: 4000,
    holdMs: 4000,
    exhaleMs: 4000,
    hold2Ms: 4000,
  },
  {
    id: '478',
    label: '4-7-8',
    description: 'Deep relaxation before sleep',
    inhaleMs: 4000,
    holdMs: 7000,
    exhaleMs: 8000,
    hold2Ms: 0,
  },
];

export function getCycleMs(pattern) {
  return pattern.inhaleMs + pattern.holdMs + pattern.exhaleMs + pattern.hold2Ms;
}

export function getDefaultPattern() {
  return BREATHING_PATTERNS[0];
}
