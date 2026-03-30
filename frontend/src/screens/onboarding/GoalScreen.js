import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/Button';
import { ProgressBar } from '../../components/ProgressBar';

const GOALS = [
  { id: 'stress', label: 'Reduce stress & anxiety', icon: 'leaf-outline' },
  { id: 'sleep', label: 'Sleep better', icon: 'moon-outline' },
  { id: 'focus', label: 'Improve focus', icon: 'bulb-outline' },
  { id: 'journal', label: 'Track my mood & journal', icon: 'journal-outline' },
  { id: 'talk', label: 'Talk to someone (AI)', icon: 'chatbubbles-outline' },
];

export function GoalScreen({ navigation, route }) {
  const { colors, fonts } = useTheme();
  const [selected, setSelected] = useState([]);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const handleContinue = () => {
    navigation.navigate('Frequency', {
      ...route.params,
      goals: selected,
    });
  };

  const handleSkip = () => {
    navigation.navigate('FirstValue', {
      ...route.params,
      goals: [],
      checkInFrequency: '',
      preferredTime: '',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ProgressBar step={1} total={3} style={styles.progress} />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[fonts.heading2, { color: colors.text }]}>What brings you here?</Text>
        <Text style={[fonts.body, { color: colors.textSecondary, marginTop: 8, marginBottom: 24 }]}>
          Select all that apply
        </Text>

        {GOALS.map((goal) => {
          const isSelected = selected.includes(goal.id);
          return (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalCard,
                {
                  backgroundColor: isSelected ? `${colors.primary}10` : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => toggle(goal.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: isSelected ? `${colors.primary}20` : `${colors.textLight}15`,
                  },
                ]}
              >
                <Ionicons
                  name={goal.icon}
                  size={22}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
              </View>
              <Text
                style={[
                  fonts.body,
                  {
                    flex: 1,
                    color: isSelected ? colors.primary : colors.text,
                    fontWeight: isSelected ? '600' : '400',
                  },
                ]}
              >
                {goal.label}
              </Text>
              {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={selected.length === 0}
          style={{ width: '100%' }}
        />
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={[fonts.body, { color: colors.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  progress: {
    marginBottom: 32,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 12,
    gap: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
  },
  skipBtn: {
    paddingVertical: 8,
  },
});
