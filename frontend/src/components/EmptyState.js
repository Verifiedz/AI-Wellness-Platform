import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';

export function EmptyState({ icon, title, subtitle, actionTitle, onAction, children }) {
  const { colors, fonts } = useTheme();

  return (
    <View style={styles.container}>
      {icon && <Ionicons name={icon} size={48} color={colors.textLight} />}
      {children}
      {title && (
        <Text
          style={[
            fonts.heading3,
            { color: colors.textSecondary, marginTop: 16, textAlign: 'center' },
          ]}
        >
          {title}
        </Text>
      )}
      {subtitle && (
        <Text
          style={[
            fonts.bodySmall,
            { color: colors.textLight, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
          ]}
        >
          {subtitle}
        </Text>
      )}
      {actionTitle && onAction && (
        <Button
          variant="secondary"
          title={actionTitle}
          onPress={onAction}
          style={{ marginTop: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
});
