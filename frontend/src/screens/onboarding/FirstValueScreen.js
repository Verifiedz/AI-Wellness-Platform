import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { BreathingCircle } from '../../components/BreathingCircle';
import { Button } from '../../components/Button';

export function FirstValueScreen({ navigation, route }) {
  const { colors, fonts } = useTheme();
  const { completeOnboarding } = useOnboarding();
  const [cycleFinished, setCycleFinished] = useState(false);

  const goals = route.params?.goals ?? [];
  const checkInFrequency = route.params?.checkInFrequency ?? '';
  const preferredTime = route.params?.preferredTime ?? '';

  const handleCycleComplete = useCallback(() => {
    setCycleFinished(true);
  }, []);

  const finish = useCallback(
    async (targetAuthRoute) => {
      await completeOnboarding({ goals, checkInFrequency, preferredTime }, targetAuthRoute);
    },
    [completeOnboarding, goals, checkInFrequency, preferredTime]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {!cycleFinished ? (
          <>
            <Text
              style={[
                fonts.body,
                { color: colors.textSecondary, marginBottom: 40, textAlign: 'center' },
              ]}
            >
              Let's start with a moment of calm
            </Text>
            <BreathingCircle size={200} onCycleComplete={handleCycleComplete} />
          </>
        ) : (
          <Animated.View entering={FadeIn.duration(600)} style={styles.doneWrap}>
            <Text style={[fonts.heading1, { color: colors.text, textAlign: 'center' }]}>
              You're ready.
            </Text>
            <Text
              style={[
                fonts.body,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 12,
                  lineHeight: 22,
                },
              ]}
            >
              That felt good, didn't it?{'\n'}Let's set up your account.
            </Text>
          </Animated.View>
        )}
      </View>

      {cycleFinished && (
        <Animated.View entering={FadeIn.delay(300).duration(400)} style={styles.footer}>
          <Button
            title="Create Account"
            onPress={() => finish('Register')}
            style={{ width: '100%' }}
          />
          <TouchableOpacity onPress={() => finish('Login')} style={styles.signInLink}>
            <Text style={[fonts.body, { color: colors.textSecondary }]}>
              I already have an account
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneWrap: {
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: 16,
  },
  signInLink: {
    paddingVertical: 8,
  },
});
