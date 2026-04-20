/**
 * Multi-select emotion chip cloud. Wraps v2 Chip; toggles in-place.
 */

import React from 'react';
import { View } from 'react-native';
import { Chip } from '../../../ui/v2';
import { useV2Theme } from '../../../theme/v2';

/**
 * @param {{
 *   options: string[],
 *   selected: string[],
 *   onChange: (next: string[]) => void,
 * }} props
 */
export function EmotionChips({ options, selected, onChange }) {
  const v2 = useV2Theme();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: v2.spacing[2],
      }}
    >
      {options.map((label) => {
        const isSelected = selected.includes(label);
        return (
          <Chip
            key={label}
            selected={isSelected}
            accessibilityLabel={`Emotion: ${label}`}
            onPress={() => {
              const next = isSelected
                ? selected.filter((s) => s !== label)
                : [...selected, label];
              onChange(next);
            }}
          >
            {label}
          </Chip>
        );
      })}
    </View>
  );
}

export default EmotionChips;
