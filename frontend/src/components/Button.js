import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  variant = 'primary',
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  style,
}) {
  const { colors, fonts } = useTheme();
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const variants = {
    primary: {
      bg: colors.primary,
      text: '#fff',
      border: 'transparent',
    },
    secondary: {
      bg: 'transparent',
      text: colors.primary,
      border: colors.primary,
    },
    ghost: {
      bg: 'transparent',
      text: colors.primary,
      border: 'transparent',
    },
    danger: {
      bg: 'transparent',
      text: colors.error,
      border: 'transparent',
    },
  };

  const v = variants[variant] || variants.primary;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: variant === 'secondary' ? 1.5 : 0,
          opacity: isDisabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[fonts.button, { color: v.text }]}>{title}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
});
