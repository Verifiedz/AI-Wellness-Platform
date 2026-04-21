/**
 * FirstValueScreen — guided breath cycle, then "You're ready" + auth choice.
 *
 * Behavior preserved: completeOnboarding({ goals, checkInFrequency, preferredTime },
 * 'Register' | 'Login') routes to the correct auth screen.
 *
 * Visual rewrite: Skia-driven BreathingPulse + ProgressRing for the inhale phase
 * instead of legacy BreathingCircle. Single 4-4 cycle (inhale 4s, hold 1s, exhale 4s)
 * matches the rest of the app's breath vocabulary.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { useV2Theme } from '../../../theme/v2';
import { useOnboarding } from '../../../context/OnboardingContext';
import {
  Button,
  ScreenScaffold,
  Text,
  ParticleBloom,
  ProgressRing,
} from '../../../ui/v2';

const TOTAL_CYCLE_MS = 9000;

export function FirstValueScreen({ navigation, route }) {
  const v2 = useV2Theme();
  const { completeOnboarding } = useOnboarding();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const bloomRef = useRef(null);
  const startedAt = useRef(Date.now());

  const goals = route?.params?.goals ?? [];
  const checkInFrequency = route?.params?.checkInFrequency ?? '';
  const preferredTime = route?.params?.preferredTime ?? '';

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      const p = Math.min(1, elapsed / TOTAL_CYCLE_MS);
      setProgress(p);
      if (p >= 1) {
        clearInterval(id);
        setDone(true);
        bloomRef.current?.bloom({ x: 207, y: 360, count: 22 });
      }
    }, 80);
    return () => clearInterval(id);
  }, []);

  const finish = useCallback(
    async (target) => {
      await completeOnboarding({ goals, checkInFrequency, preferredTime }, target);
    },
    [completeOnboarding, goals, checkInFrequency, preferredTime]
  );

  // Inhale (0-0.44) → hold (0.44-0.55) → exhale (0.55-1)
  let label = 'Breathe in…';
  let scale = 1 + 0.18 * (progress / 0.44);
  if (progress >= 0.44) {
    label = 'Hold…';
    scale = 1.18;
  }
  if (progress >= 0.55) {
    label = 'Breathe out…';
    scale = 1.18 - 0.18 * ((progress - 0.55) / 0.45);
  }
  if (done) {
    label = '';
    scale = 1;
  }

  return (
    <ScreenScaffold
      ambient
      ambientIntensity="vivid"
      paddingHorizontal={6}
      scrollable={false}
    >
      {/* While the breath cycle runs the hero is centered; once done, the
          headline + CTA group together so the gap between them is tight. */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AnimatePresence>
          {!done ? (
            <MotiView
              key="breath"
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 400 }}
              style={{ alignItems: 'center' }}
            >
              <Text
                variant="body"
                color="secondary"
                align="center"
                style={{ marginBottom: v2.spacing[8] }}
              >
                Let’s start with a moment of calm.
              </Text>
              <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
                <ProgressRing progress={progress} size={220} strokeWidth={2} />
                <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
                  <MotiView
                    animate={{ scale }}
                    transition={{ type: 'timing', duration: 200 }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: v2.palette.accent,
                      opacity: 0.85,
                    }}
                  />
                </View>
              </View>
              <Text
                variant="h3"
                color="secondary"
                align="center"
                style={{ marginTop: v2.spacing[6] }}
              >
                {label}
              </Text>
            </MotiView>
          ) : (
            <MotiView
              key="done"
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 200 }}
              style={{ alignItems: 'center', alignSelf: 'stretch' }}
            >
              <Text variant="display-lg" align="center">
                You’re ready.
              </Text>
              <Text
                variant="body-lg"
                color="secondary"
                align="center"
                style={{ marginTop: v2.spacing[3], maxWidth: 300 }}
              >
                That felt good, didn’t it?{'\n'}Let’s set up your account.
              </Text>

              {/* Group the CTAs with the headline so the spacing between
                  "Let's set up your account." and "Create account" stays
                  comfortable instead of pushing the buttons to the bottom. */}
              <View
                style={{
                  alignSelf: 'stretch',
                  marginTop: v2.spacing[6],
                  gap: v2.spacing[3],
                }}
              >
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onPress={() => finish('Register')}
                >
                  Create account
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
                  <Button variant="ghost" size="sm" onPress={() => finish('Login')}>
                    Sign in
                  </Button>
                </View>
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </View>

      <ParticleBloom ref={bloomRef} />
    </ScreenScaffold>
  );
}

export default FirstValueScreen;
