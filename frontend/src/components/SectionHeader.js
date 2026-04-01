import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function SectionHeader({ title, action, onAction, style }) {
  const { colors, fonts } = useTheme();

  return (
    <View style={[styles.row, style]}>
      <Text style={[fonts.heading3, { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      {action && onAction && (
        <TouchableOpacity
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={action}
        >
          <Text style={[fonts.bodySmall, { color: colors.primary, fontWeight: '600' }]}>
            {action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
});
