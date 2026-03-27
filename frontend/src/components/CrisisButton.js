import React, { useEffect } from "react";
import { StyleSheet, Platform, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../context/ThemeContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CrisisButton({ onPress }) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.fab, shadow, animatedStyle]}
      onPress={onPress}
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.inner,
          {
            backgroundColor: `${colors.error}14`,
            borderColor: `${colors.error}30`,
          },
        ]}
      >
        <Ionicons name="heart-circle" size={26} color={colors.error} />
      </Animated.View>
    </AnimatedPressable>
  );
}

const shadow = Platform.select({
  ios: {
    shadowColor: "#D4726A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 80,
    right: 16,
    zIndex: 100,
  },
  inner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
