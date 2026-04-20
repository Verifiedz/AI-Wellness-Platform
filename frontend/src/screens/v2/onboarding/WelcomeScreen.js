/**
 * Welcome screen — first impression. Breathing aurora orb + display headline +
 * "Get started" / "Sign in" routing.
 *
 * Behavior preserved: completeOnboarding({}, 'Login') for sign-in, navigates to
 * 'Goal' for new users.
 */

import React from 'react';
import { View } from 'react-native';
import { useV2Theme } from '../../../theme/v2';
import { useOnboarding } from '../../../context/OnboardingContext';
import {
  Button,
  ScreenScaffold,
  Text,
  BreathingPulse,
} from '../../../ui/v2';

export function WelcomeScreen({ navigation }) {
  const v2 = useV2Theme();
  const { completeOnboarding } = useOnboarding();

  const handleSignIn = async () => {
    await completeOnboarding({}, 'Login');
  };

  return (
    <ScreenScaffold ambient ambientIntensity="vivid" paddingHorizontal={6}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <BreathingPulse pace="slow">
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: v2.palette.accent,
              opacity: 0.85,
            }}
          />
        </BreathingPulse>
        <Text
          variant="display-lg"
          align="center"
          style={{ marginTop: v2.spacing[8] }}
        >
          Welcome to Sakina
        </Text>
        <Text
          variant="body-lg"
          color="secondary"
          align="center"
          style={{ marginTop: v2.spacing[2], maxWidth: 320 }}
        >
          Your AI companion for well-being.
        </Text>
        <Text
          variant="body"
          color="tertiary"
          align="center"
          style={{ marginTop: v2.spacing[6], maxWidth: 280, fontStyle: 'italic' }}
        >
          Take a deep breath.{'\n'}We’ll figure this out together.
        </Text>
      </View>

      <View style={{ gap: v2.spacing[3], paddingBottom: v2.spacing[4] }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => navigation.navigate('Goal')}
        >
          Get started
        </Button>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: v2.spacing[1],
          }}
        >
          <Text variant="body" color="secondary">
            Already have an account?
          </Text>
          <Button variant="ghost" size="sm" onPress={handleSignIn}>
            Sign in
          </Button>
        </View>
      </View>
    </ScreenScaffold>
  );
}

export default WelcomeScreen;
