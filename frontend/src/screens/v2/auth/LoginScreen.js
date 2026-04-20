/**
 * LoginScreen v2 — Midnight Aurora / Sage Mist redesign.
 *
 * Behavior is functionally identical to the legacy LoginScreen. Differences
 * are visual: ScreenScaffold w/ ambient aurora, v2 Inputs with floating labels,
 * v2 Button with loading blob, calm Toast for surfaced errors. RHF + zod for
 * validation. Tap-outside dismisses keyboard via ScreenScaffold.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../../context/AuthContext';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Input,
  ScreenScaffold,
  Text,
  Toast,
} from '../../../ui/v2';
import { BreathingPulse } from '../../../ui/v2';

const schema = z.object({
  email: z.string().min(1, 'Please enter your email').email('Please enter a valid email'),
  password: z.string().min(1, 'Please enter your password'),
});

export function LoginScreen({ navigation, route }) {
  const v2 = useV2Theme();
  const { login } = useAuth();
  const toastRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  const prefillEmail = route?.params?.email ?? '';
  const verified = route?.params?.verified ?? false;
  const resetSuccess = route?.params?.resetSuccess ?? false;

  const { control, handleSubmit, setValue, formState } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { email: prefillEmail, password: '' },
  });

  useEffect(() => {
    if (prefillEmail) setValue('email', prefillEmail);
  }, [prefillEmail, setValue]);

  useEffect(() => {
    if (verified) {
      toastRef.current?.show({
        kind: 'success',
        title: 'Email verified',
        body: 'Your account is ready. Sign in to continue.',
      });
    } else if (resetSuccess) {
      toastRef.current?.show({
        kind: 'success',
        title: 'Password reset',
        body: 'Sign in with your new password.',
      });
    }
  }, [verified, resetSuccess]);

  const onSubmit = async ({ email, password }) => {
    setUnverifiedEmail('');
    setSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (result?.requiresTwoFactor) {
        navigation.navigate('TwoFactor', {
          email: result.email || email.trim(),
          message: result.message,
          expiresAt: result.twoFactorExpiresAt || null,
        });
      }
    } catch (err) {
      const msg = err?.message || '';
      let title = 'Sign in failed';
      let body = 'Please try again in a moment.';
      if (/email not verified/i.test(msg)) {
        title = 'Email not verified';
        body = 'Verify your email to continue.';
        setUnverifiedEmail(email.trim());
      } else if (/temporarily locked|too many failed/i.test(msg)) {
        title = 'Account temporarily locked';
        body = 'Take a breath. Try again in a few minutes.';
      } else if (/invalid credentials/i.test(msg)) {
        title = 'Incorrect email or password';
        body = 'Check your details and try again.';
      } else if (/deactivated/i.test(msg)) {
        title = 'Account deactivated';
        body = 'Reach out to support if this is unexpected.';
      }
      toastRef.current?.show({ kind: 'error', title, body });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenScaffold ambient ambientIntensity="normal" keyboardAware paddingHorizontal={6}>
      <View style={{ flex: 1, justifyContent: 'center', minHeight: 600 }}>
        {/* Brand mark */}
        <View style={{ alignItems: 'center', marginBottom: v2.spacing[10] }}>
          <BreathingPulse>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: v2.palette.accent,
                opacity: 0.85,
              }}
            />
          </BreathingPulse>
          <Text variant="display-lg" align="center" style={{ marginTop: v2.spacing[5] }}>
            Welcome back
          </Text>
          <Text
            variant="body"
            color="secondary"
            align="center"
            style={{ marginTop: v2.spacing[1], maxWidth: 280 }}
          >
            Your daily companion for well-being.
          </Text>
        </View>

        {/* Form */}
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="you@email.com"
              keyboardType="email-address"
              returnKeyType="next"
              error={fieldState.error?.message}
              testID="login-email-input"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Input
              label="Password"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="••••••••"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
              error={fieldState.error?.message}
              testID="login-password-input"
            />
          )}
        />

        {/* Forgot password */}
        <View style={{ alignItems: 'flex-end', marginTop: -v2.spacing[1], marginBottom: v2.spacing[3] }}>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('ForgotPassword')}
            haptic="tap"
          >
            Forgot password?
          </Button>
        </View>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting || formState.isSubmitting}
          onPress={handleSubmit(onSubmit)}
          haptic="firm"
          accessibilityLabel="Sign in"
          testID="login-submit"
        >
          Sign in
        </Button>

        {unverifiedEmail ? (
          <View style={{ marginTop: v2.spacing[3] }}>
            <Button
              variant="secondary"
              size="md"
              fullWidth
              onPress={() => navigation.navigate('VerifyEmail', { email: unverifiedEmail })}
            >
              Verify your email
            </Button>
          </View>
        ) : null}

        {/* Footer */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: v2.spacing[6],
            gap: v2.spacing[1],
          }}
        >
          <Text variant="body" color="secondary">
            New here?
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate('Register')}
            haptic="tap"
          >
            Create account
          </Button>
        </View>
      </View>

      <Toast ref={toastRef} />
    </ScreenScaffold>
  );
}

export default LoginScreen;
