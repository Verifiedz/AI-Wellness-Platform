import React, { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

const VARIANT_ICONS = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  warning: 'warning',
  info: 'information-circle',
};

function getVariantColor(variant, colors) {
  switch (variant) {
    case 'success':
      return colors.success;
    case 'error':
      return colors.error;
    case 'warning':
      return colors.warning;
    case 'info':
      return colors.primary;
    default:
      return colors.primary;
  }
}

export function Toast() {
  const { current, dismissCurrent } = useToast();
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const timerRef = useRef(null);

  const dismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    translateY.value = withTiming(-120, {
      duration: 250,
      easing: Easing.bezier(0.4, 0, 1, 0.5),
    });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(dismissCurrent)();
      }
    });
  };

  useEffect(() => {
    if (!current) return;

    // Slide in
    translateY.value = withTiming(0, {
      duration: 350,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
    });
    opacity.value = withTiming(1, { duration: 300 });

    // Auto-dismiss timer
    timerRef.current = setTimeout(() => {
      dismiss();
    }, current.duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [current?.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!current) return null;

  const accentColor = getVariantColor(current.variant, colors);
  const iconName = VARIANT_ICONS[current.variant] || VARIANT_ICONS.info;
  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 44) + 8;

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        {
          top: topOffset,
          backgroundColor: colors.surface,
          borderLeftColor: accentColor,
          shadowColor: colors.text,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={dismiss}
        activeOpacity={0.8}
        accessibilityRole="alert"
        accessibilityLabel={current.message}
      >
        <Ionicons name={iconName} size={22} color={accentColor} style={styles.icon} />
        <Text
          style={[
            fonts.body,
            styles.message,
            { color: colors.text },
          ]}
          numberOfLines={3}
        >
          {current.message}
        </Text>
        <Ionicons name="close" size={18} color={colors.textLight} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 14,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  icon: {
    flexShrink: 0,
  },
  message: {
    flex: 1,
    lineHeight: 20,
  },
});
