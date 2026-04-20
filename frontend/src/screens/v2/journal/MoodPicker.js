/**
 * Mood picker for the journal editor — same MOOD_TOKENS used by HomeScreen's
 * DailyCheckIn so the visual language is consistent.
 *
 * Larger touch targets than the home variant since this is the focal control.
 */

import React from 'react';
import { Pressable, View } from 'react-native';
import { useV2Theme } from '../../../theme/v2';
import { useHaptic, Text } from '../../../ui/v2';
import { MOOD_TOKENS } from '../home/moodTokens';

/**
 * @param {{
 *   value: string | null,
 *   onChange: (id: string) => void,
 * }} props
 */
export function MoodPicker({ value, onChange }) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: v2.spacing[2],
      }}
    >
      {MOOD_TOKENS.map(({ id, label, Icon, colorOf }) => {
        const isSelected = value === id;
        const color = colorOf(v2.palette);
        return (
          <Pressable
            key={id}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Mood: ${label}`}
            onPress={() => {
              fireHaptic('soft');
              onChange(id);
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: v2.spacing[4],
              borderRadius: v2.radius.lg,
              backgroundColor: isSelected
                ? v2.palette.bg.elevated
                : v2.palette.bg.surfaceHigh,
              borderWidth: 1,
              borderColor: isSelected ? v2.palette.primary : v2.palette.border.subtle,
            }}
          >
            <Icon size={28} color={color} weight={isSelected ? 'fill' : 'duotone'} />
            <Text
              variant="caption"
              style={{
                color: isSelected ? v2.palette.text.primary : v2.palette.text.secondary,
                marginTop: 6,
                fontFamily: isSelected ? 'DMSans_600SemiBold' : 'DMSans_500Medium',
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default MoodPicker;
