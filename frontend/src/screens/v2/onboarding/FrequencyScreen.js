/**
 * Frequency screen — single-select check-in cadence.
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import { useV2Theme } from '../../../theme/v2';
import { useHaptic } from '../../../ui/v2';
import { Button, Card, Text } from '../../../ui/v2';
import { OnboardingScaffold } from './OnboardingScaffold';

const OPTIONS = [
  { id: 'daily', label: 'Every day', recommended: true },
  { id: 'few_weekly', label: 'A few times a week' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'later', label: 'I\u2019ll decide later' },
];

export function FrequencyScreen({ navigation, route }) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    navigation.navigate('TimeOfDay', { ...route?.params, checkInFrequency: selected || '' });
  };

  return (
    <OnboardingScaffold
      step={2}
      total={3}
      onBack={() => navigation.goBack()}
      title="How often will you check in?"
      subtitle="A gentle rhythm. You can change this anytime."
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
      <View style={{ gap: v2.spacing[3] }}>
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <Card
              key={opt.id}
              padding={4}
              onPress={() => {
                fireHaptic('tap');
                setSelected(opt.id);
              }}
              accessibilityRole="radio"
              accessibilityLabel={opt.label}
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
                <Radio selected={isSelected} v2={v2} />
                <Text
                  variant="body-lg"
                  style={{
                    flex: 1,
                    color: isSelected ? v2.palette.primary : v2.palette.text.primary,
                    fontFamily: isSelected ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                  }}
                >
                  {opt.label}
                </Text>
                {opt.recommended ? (
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: v2.radius.full,
                      backgroundColor: v2.palette.bg.elevated,
                      borderWidth: 1,
                      borderColor: v2.palette.primary,
                    }}
                  >
                    <Text
                      variant="caption"
                      style={{ color: v2.palette.primary, fontFamily: 'DMSans_600SemiBold' }}
                    >
                      Recommended
                    </Text>
                  </View>
                ) : null}
              </View>
            </Card>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}

function Radio({ selected, v2 }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: selected ? v2.palette.primary : v2.palette.border.strong,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {selected ? (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: v2.palette.primary,
          }}
        />
      ) : null}
    </View>
  );
}

export default FrequencyScreen;
