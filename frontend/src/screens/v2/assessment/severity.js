/**
 * Map severity strings to v2 palette tokens. Replaces hardcoded
 * severity colors (#6BAF7D / #E8C16A / #E8A06A / #D4726A / #C0392B)
 * the audit flagged in HomeScreen and the legacy AssessmentResultScreen.
 */

/**
 * @param {import('../../../theme/v2').V2Theme['palette']} palette
 * @param {string|undefined} severity
 * @returns {string}
 */
export function severityColor(palette, severity) {
  switch ((severity || '').toLowerCase()) {
    case 'minimal':
    case 'minimal_or_none':
    case 'none':
      return palette.success;
    case 'mild':
      return palette.accent;
    case 'moderate':
      return palette.warning;
    case 'moderately_severe':
      return palette.secondary;
    case 'severe':
      return palette.error;
    default:
      return palette.text.tertiary;
  }
}
