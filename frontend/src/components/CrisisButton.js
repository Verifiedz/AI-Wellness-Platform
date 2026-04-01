import React from 'react';
import { StyleSheet, Pressable, DeviceEventEmitter } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useHaptic } from '../hooks/useHaptic';

export function CrisisButton() {
  const { colors } = useTheme();
  const haptic = useHaptic();

  const handlePress = () => {
    haptic.triggerImpact('Light');
    DeviceEventEmitter.emit('crisis:open');
  };

  return (
    <Pressable
      style={styles.btn}
      onPress={handlePress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Emergency crisis resources"
    >
      <Ionicons name="heart-circle" size={26} color={colors.error} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    marginRight: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
