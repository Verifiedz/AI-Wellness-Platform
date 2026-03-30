import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ESCALATION_TYPES } from '../../constants/escalationMarkers';

/**
 * In-chat card rendered when the AI includes an [ESCALATE:*] marker.
 * Shows a gentle suggestion with an action button.
 *
 * @param {{ escalationType: string, onAction: (actionType: string) => void }} props
 */
export function EscalationCard({ escalationType, onAction }) {
  const { colors, fonts } = useTheme();
  const config = ESCALATION_TYPES[escalationType];

  if (!config) return null;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: `${config.color}08`, borderColor: `${config.color}30` },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: `${config.color}15` }]}>
          <Ionicons name={config.icon} size={22} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[fonts.body, { color: colors.text, fontWeight: '600' }]}>
            {config.title}
          </Text>
          <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
            {config.description}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: config.color }]}
        onPress={() => onAction(config.actionType)}
        activeOpacity={0.8}
      >
        <Ionicons name={config.icon} size={16} color="#FFFFFF" />
        <Text style={[fonts.bodySmall, { color: '#FFFFFF', fontWeight: '600' }]}>
          {config.actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
});
