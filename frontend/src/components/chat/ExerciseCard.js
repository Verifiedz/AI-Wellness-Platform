import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { GroundingExercise } from './GroundingExercise';
import { ThoughtReframingCard } from './ThoughtReframingCard';

const EXERCISE_CONFIG = {
  breathing: {
    icon: 'leaf-outline',
    title: 'Breathing Exercise',
    duration: '2 min',
    description: 'Guided breathing to calm your mind',
  },
  reframing: {
    icon: 'bulb-outline',
    title: 'Thought Reframing',
    duration: '3 min',
    description: 'Challenge unhelpful thought patterns',
  },
  grounding: {
    icon: 'hand-left-outline',
    title: '5-4-3-2-1 Grounding',
    duration: '2 min',
    description: 'Reconnect with the present moment',
  },
};

export function ExerciseCard({ exerciseType, onStartBreathing }) {
  const { colors, fonts } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const config = EXERCISE_CONFIG[exerciseType];

  if (!config) return null;

  const handleStart = () => {
    if (exerciseType === 'breathing') {
      onStartBreathing?.();
      return;
    }
    setIsExpanded(true);
  };

  const handleComplete = () => {
    setIsExpanded(false);
    setIsCompleted(true);
  };

  // Inline exercises (grounding, reframing) expand in place
  if (isExpanded) {
    return (
      <View
        style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}
      >
        {exerciseType === 'grounding' && <GroundingExercise onComplete={handleComplete} />}
        {exerciseType === 'reframing' && <ThoughtReframingCard onComplete={handleComplete} />}
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name={config.icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={[fonts.body, { color: colors.text, fontWeight: '600' }]}>
            {config.title}
          </Text>
          <Text style={[fonts.caption, { color: colors.textSecondary }]}>{config.description}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[fonts.caption, { color: colors.textLight }]}>{config.duration}</Text>
        {isCompleted ? (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[fonts.caption, { color: colors.success, fontWeight: '600' }]}>Done</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: colors.primary }]}
            onPress={handleStart}
            activeOpacity={0.8}
          >
            <Text style={[fonts.caption, { color: '#fff', fontWeight: '600' }]}>Start</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  startBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
