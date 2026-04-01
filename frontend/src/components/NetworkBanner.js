import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNetwork } from '../context/NetworkContext';

/**
 * Persistent banner displayed at the top of the screen when offline.
 * Auto-hides when the connection is restored.
 */
export function NetworkBanner() {
  const { colors, fonts } = useTheme();
  const { isOnline } = useNetwork();

  if (isOnline) return null;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.error + '14' }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Ionicons name="cloud-offline-outline" size={18} color={colors.error} />
      <Text style={[fonts.bodySmall, styles.text, { color: colors.error }]}>
        No internet connection
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  text: {
    flex: 1,
    fontWeight: '500',
  },
});
