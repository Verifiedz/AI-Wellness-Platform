import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useHaptic } from '../hooks/useHaptic';

export function SuggestionChip({ label, onPress, style }) {
  const { colors, fonts } = useTheme();
  const haptic = useHaptic();

  const handlePress = () => {
    haptic.triggerSelection();
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: `${colors.primary}12`,
          borderColor: `${colors.primary}30`,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[fonts.bodySmall, { color: colors.primary, fontWeight: '500' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
});
