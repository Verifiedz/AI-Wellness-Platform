import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useHaptic } from '../hooks/useHaptic';

/**
 * Circular microphone button for voice input.
 *
 * Visual states:
 * - Idle: themed mic icon
 * - Recording: pulsing red dot + mic-active icon
 * - Unavailable: hidden (parent should not render this component)
 *
 * @param {{ isListening: boolean, onPress: () => void, disabled?: boolean, style?: object }} props
 */
export function VoiceInputButton({ isListening, onPress, disabled, style }) {
  const { colors } = useTheme();
  const haptic = useHaptic();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  const handlePress = () => {
    haptic.triggerSelection();
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel={isListening ? 'Stop recording' : 'Start voice input'}
      accessibilityState={{ disabled: disabled }}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          {
            backgroundColor: isListening ? `${colors.error}20` : `${colors.primary}15`,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Ionicons
          name={isListening ? 'mic' : 'mic-outline'}
          size={20}
          color={isListening ? colors.error : colors.primary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
