/**
 * 5-step energy scale. Tap a level to set; haptic on change.
 * Matches the legacy 5 buttons (Very Low → Very High) but uses Card-style chips.
 */

import React from 'react';
import { Pressable, View } from 'react-native';
import { useV2Theme } from '../../../theme/v2';
import { useHaptic, Text } from '../../../ui/v2';

const LEVELS = [
  { id: 1, short: 'Very Low' },
  { id: 2, short: 'Low' },
  { id: 3, short: 'Mid' },
  { id: 4, short: 'High' },
  { id: 5, short: 'Very High' },
];

/**
 * @param {{
 *   value: number,
 *   onChange: (level: number) => void,
 * }} props
 */
export function EnergyScale({ value, onChange }) {
  const v2 = useV2Theme();
  const fireHaptic = useHaptic();
  return (
    <View style={{ flexDirection: 'row', gap: v2.spacing[2] }}>
      {LEVELS.map((level) => {
        const active = value === level.id;
        return (
          <Pressable
            key={level.id}
            accessibilityRole="radio"
            accessibilityLabel={`Energy: ${level.short}`}
            accessibilityState={{ selected: active }}
            onPress={() => {
              fireHaptic('tap');
              onChange(level.id);
            }}
            style={{
              flex: 1,
              minHeight: 48,
              borderRadius: v2.radius.md,
              backgroundColor: active ? v2.palette.primary : v2.palette.bg.surfaceHigh,
              borderWidth: 1,
              borderColor: active ? v2.palette.primary : v2.palette.border.subtle,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text
              variant="caption"
              align="center"
              style={{
                color: active ? v2.palette.text.onPrimary : v2.palette.text.secondary,
                fontFamily: active ? 'DMSans_600SemiBold' : 'DMSans_500Medium',
              }}
            >
              {level.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default EnergyScale;
