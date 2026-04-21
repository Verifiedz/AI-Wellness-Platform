/**
 * TimeOfDay screen — 2x2 grid of time-of-day cards.
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import { Sun, CloudSun, Moon, Clock } from 'phosphor-react-native';
import { useV2Theme } from '../../../theme/v2';
import { useHaptic } from '../../../ui/v2';
import { Button, Card, Text } from '../../../ui/v2';
import { OnboardingScaffold } from './OnboardingScaffold';

const OPTIONS = [
  { id: 'morning', label: 'Morning', Icon: Sun },
  { id: 'afternoon', label: 'Afternoon', Icon: CloudSun },
  { id: 'evening', label: 'Evening', Icon: Moon },
  { id: 'none', label: 'No preference', Icon: Clock },
];

export function TimeOfDayScreen({ navigation, route }) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    navigation.navigate('FirstValue', { ...route?.params, preferredTime: selected || '' });
  };

  return (
    <OnboardingScaffold
      step={3}
      total={3}
      onBack={() => navigation.goBack()}
      title="When do you feel most reflective?"
      subtitle="We’ll tailor the rhythm to this time."
      footer={
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selected}
          onPress={handleContinue}
        >
          Continue
        </Button>
      }
    >
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: v2.spacing[3],
        }}
      >
        {OPTIONS.map(({ id, label, Icon }) => {
          const isSelected = selected === id;
          return (
            <View key={id} style={{ width: '48%' }}>
              <Card
                padding={5}
                onPress={() => {
                  fireHaptic('tap');
                  setSelected(id);
                }}
                accessibilityRole="radio"
                accessibilityLabel={label}
                style={{
                  alignItems: 'center',
                  // Force a uniform card height so "No preference" doesn't
                  // out-grow the three shorter labels.
                  minHeight: 148,
                  justifyContent: 'center',
                  ...(isSelected
                    ? {
                        borderColor: v2.palette.primary,
                        backgroundColor: v2.palette.bg.surfaceHigh,
                      }
                    : {}),
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: isSelected
                      ? v2.palette.bg.elevated
                      : v2.palette.bg.surfaceHigh,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    size={28}
                    weight={isSelected ? 'fill' : 'duotone'}
                    color={isSelected ? v2.palette.primary : v2.palette.text.secondary}
                  />
                </View>
                <Text
                  variant="body"
                  numberOfLines={1}
                  style={{
                    color: isSelected ? v2.palette.primary : v2.palette.text.primary,
                    fontFamily: isSelected ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                    marginTop: 12,
                  }}
                >
                  {label}
                </Text>
              </Card>
            </View>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}

export default TimeOfDayScreen;
