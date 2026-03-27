import React, { useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Logo } from "../../components/Logo";
import { Button } from "../../components/Button";

export function WelcomeScreen({ navigation }) {
  const { colors, fonts } = useTheme();
  const { completeOnboarding } = useOnboarding();
  const pulse = useSharedValue(1);

  const handleSignIn = useCallback(async () => {
    await completeOnboarding({}, "Login");
  }, [completeOnboarding]);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View style={pulseStyle}>
          <Logo size="large" showText={false} />
        </Animated.View>

        <Text style={[fonts.heading1, styles.title, { color: colors.text }]}>
          Welcome to Sakina
        </Text>
        <Text
          style={[fonts.body, styles.subtitle, { color: colors.textSecondary }]}
        >
          Your AI wellness companion
        </Text>
        <Text
          style={[
            fonts.body,
            styles.tagline,
            { color: colors.textLight, fontStyle: "italic" },
          ]}
        >
          Take a deep breath.{"\n"}We'll figure this out together.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          title="Get Started"
          onPress={() => navigation.navigate("Goal")}
        />
        <TouchableOpacity
          style={styles.signInLink}
          onPress={handleSignIn}
        >
          <Text style={[fonts.body, { color: colors.textSecondary }]}>
            Already have an account?{" "}
            <Text style={{ color: colors.secondary, fontWeight: "600" }}>
              Sign in
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 28,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
  },
  tagline: {
    marginTop: 20,
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    gap: 16,
    alignItems: "center",
  },
  signInLink: {
    paddingVertical: 8,
  },
});
