/**
 * Marker protocol for interactive elements in AI chat messages.
 *
 * The AI system prompt instructs the model to embed these markers in its
 * responses. The ChatMessageRenderer parses them out and replaces each
 * marker with the corresponding interactive UI component.
 *
 * Markers are never shown to the user as raw text.
 */

/** Triggers a row of mood quick-reply buttons. */
export const MOOD_CHECK_MARKER = "[MOOD_CHECK]";

/** Triggers an inline breathing exercise card. */
export const EXERCISE_BREATHING_MARKER = "[EXERCISE:breathing]";

/** Triggers an inline thought reframing card. */
export const EXERCISE_REFRAMING_MARKER = "[EXERCISE:reframing]";

/** Triggers an inline grounding exercise card. */
export const EXERCISE_GROUNDING_MARKER = "[EXERCISE:grounding]";

/**
 * Regex that matches any known marker in a message string.
 * Uses a capturing group so `String.split()` retains the matched markers
 * as separate array elements.
 */
export const MARKER_REGEX =
  /(\[MOOD_CHECK\]|\[EXERCISE:breathing\]|\[EXERCISE:reframing\]|\[EXERCISE:grounding\])/g;

/**
 * Returns the exercise type from an exercise marker string, or null.
 * e.g. "[EXERCISE:breathing]" -> "breathing"
 */
export function getExerciseType(marker) {
  const match = marker.match(/^\[EXERCISE:(\w+)\]$/);
  return match ? match[1] : null;
}
