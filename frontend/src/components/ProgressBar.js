import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

export function ProgressBar({ step, total, color, style }) {
  const { colors } = useTheme();
  const fillColor = color || colors.primary;
  const fraction = Math.min(step / total, 1);

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${fraction * 100}%`, { duration: 350 }),
  }));

  return (
    <View style={[styles.track, { backgroundColor: colors.border }, style]}>
      <Animated.View style={[styles.fill, { backgroundColor: fillColor }, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
