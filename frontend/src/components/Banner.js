import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const VARIANT_CONFIG = {
  error: { icon: 'alert-circle', bgOpacity: 0.08 },
  success: { icon: 'checkmark-circle', bgOpacity: 0.1 },
  warning: { icon: 'warning', bgOpacity: 0.12 },
  info: { icon: 'information-circle', bgOpacity: 0.08 },
};

export function Banner({ variant = 'info', message, action, onAction, onDismiss, icon, style }) {
  const { colors, fonts } = useTheme();
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.info;

  const colorMap = {
    error: colors.error,
    success: colors.success,
    warning: colors.warning,
    info: colors.primary,
  };
  const tint = colorMap[variant] || colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: tint + '14' }, style]}>
      <Ionicons name={icon || config.icon} size={18} color={tint} />
      <Text style={[fonts.bodySmall, styles.text, { color: tint }]}>{message}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={[fonts.bodySmall, { color: colors.primary, fontWeight: '700' }]}>
            {action}
          </Text>
        </TouchableOpacity>
      )}
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" size={16} color={tint} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  text: {
    flex: 1,
    fontWeight: '500',
  },
});
