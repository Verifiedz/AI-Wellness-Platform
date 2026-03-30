/**
 * Escalation marker protocol for AI chat messages.
 *
 * The AI system prompt instructs the model to embed these markers
 * when it detects situations that warrant human escalation.
 * ChatMessageRenderer parses them and renders EscalationCard.
 */

export const ESCALATE_CRISIS_MARKER = '[ESCALATE:CRISIS]';
export const ESCALATE_PROFESSIONAL_MARKER = '[ESCALATE:PROFESSIONAL]';
export const ESCALATE_PEER_MARKER = '[ESCALATE:PEER]';

/**
 * Returns the escalation type from a marker string, or null.
 * e.g. "[ESCALATE:CRISIS]" -> "CRISIS"
 */
export function getEscalationType(marker) {
  const match = marker.match(/^\[ESCALATE:(\w+)\]$/);
  return match ? match[1] : null;
}

/**
 * Escalation type definitions for rendering.
 */
export const ESCALATION_TYPES = {
  CRISIS: {
    title: 'Crisis Support Available',
    description: 'You can reach crisis resources anytime you need them.',
    icon: 'call-outline',
    actionLabel: 'View Crisis Resources',
    actionType: 'crisis',
    color: '#C0392B',
  },
  PROFESSIONAL: {
    title: 'Professional Support',
    description: 'Speaking with a professional could provide additional support.',
    icon: 'medical-outline',
    actionLabel: 'Find a Professional',
    actionType: 'professional',
    color: '#4A7FA5',
  },
  PEER: {
    title: 'Peer Community',
    description: 'Others in our community may share similar experiences.',
    icon: 'people-outline',
    actionLabel: 'Visit Community',
    actionType: 'peer',
    color: '#5B7F6E',
  },
};
