/**
 * Goal screen — multi-select intentions.
 * Behavior preserved: nav targets, route.params shape, "skip" path identical.
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Leaf,
  Moon,
  Lightbulb,
  Notebook,
  ChatsCircle,
  CheckCircle,
} from 'phosphor-react-native';
import { useV2Theme } from '../../../theme/v2';
import { useHaptic } from '../../../ui/v2';
import { Button, Card, Text } from '../../../ui/v2';
import { OnboardingScaffold } from './OnboardingScaffold';

const GOALS = [
  { id: 'stress', label: 'Reduce stress & anxiety', Icon: Leaf },
  { id: 'sleep', label: 'Sleep better', Icon: Moon },
  { id: 'focus', label: 'Improve focus', Icon: Lightbulb },
  { id: 'journal', label: 'Track my mood & journal', Icon: Notebook },
  { id: 'talk', label: 'Talk to someone (AI)', Icon: ChatsCircle },
];

export function GoalScreen({ navigation, route }) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();
  const [selected, setSelected] = useState([]);

  const toggle = (id) => {
    fireHaptic('tap');
    setSelected((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const handleContinue = () => {
    navigation.navigate('Frequency', { ...route?.params, goals: selected });
  };
  const handleSkip = () => {
    navigation.navigate('FirstValue', {
      ...route?.params,
      goals: [],
      checkInFrequency: '',
      preferredTime: '',
    });
  };

  return (
    <OnboardingScaffold
      step={1}
      total={3}
      onBack={() => navigation.goBack()}
      title="What brings you here?"
      subtitle="Select all that resonate."
      footer={
        <View style={{ gap: v2.spacing[2], alignItems: 'center' }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={selected.length === 0}
            onPress={handleContinue}
          >
            Continue
          </Button>
          <Button variant="ghost" size="sm" onPress={handleSkip}>
            Skip for now
          </Button>
        </View>
      }
    >
      <View style={{ gap: v2.spacing[3] }}>
        {GOALS.map(({ id, label, Icon }) => {
          const isSelected = selected.includes(id);
          return (
            <Card
              key={id}
              padding={4}
              onPress={() => toggle(id)}
              accessibilityLabel={label}
              accessibilityRole="checkbox"
              style={
                isSelected
                  ? {
                      borderColor: v2.palette.primary,
                      backgroundColor: v2.palette.bg.surfaceHigh,
                    }
                  : undefined
              }
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: v2.spacing[3],
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: v2.radius.md,
                    backgroundColor: isSelected
                      ? v2.palette.bg.elevated
                      : v2.palette.bg.surfaceHigh,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    size={22}
                    weight={isSelected ? 'fill' : 'duotone'}
                    color={isSelected ? v2.palette.primary : v2.palette.text.secondary}
                  />
                </View>
                <Text
                  variant="body-lg"
                  style={{
                    flex: 1,
                    color: isSelected ? v2.palette.primary : v2.palette.text.primary,
                    fontFamily: isSelected ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                  }}
                >
                  {label}
                </Text>
                {isSelected ? (
                  <CheckCircle size={22} color={v2.palette.primary} weight="fill" />
                ) : null}
              </View>
            </Card>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}

export default GoalScreen;
