import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useHaptic } from '../hooks/useHaptic';

export function ChipGroup({ items, selected, onSelect, multiSelect = false, style }) {
  const { colors, fonts } = useTheme();
  const haptic = useHaptic();

  const isSelected = (item) => {
    if (multiSelect) return Array.isArray(selected) && selected.includes(item);
    return selected === item;
  };

  const handlePress = (item) => {
    haptic.triggerSelection();
    if (multiSelect) {
      const arr = Array.isArray(selected) ? selected : [];
      const next = arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
      onSelect(next);
    } else {
      onSelect(item);
    }
  };

  const chipItems = items.map((item) => {
    const label = typeof item === 'string' ? item : item.label;
    const value = typeof item === 'string' ? item : item.id;
    return { label, value };
  });

  return (
    <View style={[styles.wrap, style]}>
      {chipItems.map(({ label, value }) => {
        const active = isSelected(value);
        return (
          <TouchableOpacity
            key={value}
            style={[
              styles.chip,
              {
                backgroundColor: active ? `${colors.primary}18` : colors.background,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handlePress(value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                fonts.bodySmall,
                {
                  color: active ? colors.primary : colors.textSecondary,
                  fontWeight: active ? '600' : '400',
                },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
});
