/**
 * VerifyEmailScreen v2 — 6-digit code + resend cooldown.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { EnvelopeOpen } from 'phosphor-react-native';
import { authApi } from '../../../services/authApi';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  EmptyState,
  ScreenScaffold,
  ScreenHeader,
  Text,
  Toast,
} from '../../../ui/v2';
import { CodeInput } from './CodeInput';

const RESEND_COOLDOWN = 60;
const MAX_RESEND_ATTEMPTS = 3;

const schema = z.object({
  code: z.string().length(6, 'Enter the 6-digit code'),
});

export function VerifyEmailScreen({ navigation, route }) {
  const v2 = useV2Theme();
  const toastRef = useRef(null);
  const email = route?.params?.email ?? '';
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resendCount, setResendCount] = useState(0);
  const cooldownRef = useRef(null);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startCooldown();
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { code: '' },
  });

  const onSubmit = async ({ code }) => {
    setSubmitting(true);
    try {
      const result = await authApi.verifyEmail(email, code.trim());
      if (result?.error) {
        toastRef.current?.show({
          kind: 'error',
          title: 'Verification failed',
          body: result.error,
        });
        return;
      }
      navigation.navigate('Login', { email, verified: true });
    } catch (e) {
      toastRef.current?.show({
        kind: 'error',
        title: 'Verification failed',
        body: e?.message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendCount >= MAX_RESEND_ATTEMPTS) return;
    try {
      const result = await authApi.resendVerification(email);
      if (result?.error) {
        toastRef.current?.show({ kind: 'error', title: 'Resend failed', body: result.error });
        return;
      }
      setResendCount((c) => c + 1);
      toastRef.current?.show({
        kind: 'success',
        title: 'Code resent',
        body: 'Check your inbox for the new code.',
      });
      startCooldown();
    } catch (e) {
      toastRef.current?.show({
        kind: 'error',
        title: 'Resend failed',
        body: e?.message || 'Please try again.',
      });
    }
  };

  if (!email) {
    return (
      <ScreenScaffold ambient paddingHorizontal={6}>
        <ScreenHeader onBack={() => navigation.goBack()} />
        <EmptyState
          title="Missing email"
          body="No email address was provided. Please register or sign in first."
          action={{ label: 'Go to register', onPress: () => navigation.navigate('Register') }}
        />
      </ScreenScaffold>
    );
  }

  const resendDisabled = cooldown > 0 || resendCount >= MAX_RESEND_ATTEMPTS;
  const resendLabel =
    resendCount >= MAX_RESEND_ATTEMPTS
      ? 'Resend limit reached'
      : cooldown > 0
      ? `Resend code in ${cooldown}s`
      : 'Resend code';

  return (
    <ScreenScaffold ambient ambientIntensity="subtle" keyboardAware paddingHorizontal={6}>
      <ScreenHeader onBack={() => navigation.goBack()} />

      <View style={{ alignItems: 'center', marginTop: v2.spacing[4], marginBottom: v2.spacing[6] }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: v2.palette.bg.surface,
            borderWidth: 1,
            borderColor: v2.palette.border.subtle,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: v2.spacing[4],
          }}
        >
          <EnvelopeOpen size={28} color={v2.palette.primary} weight="duotone" />
        </View>
        <Text variant="display-lg" align="center">Verify email</Text>
        <Text
          variant="body"
          color="secondary"
          align="center"
          style={{ marginTop: v2.spacing[2], maxWidth: 320 }}
        >
          We sent a 6-digit code to{' '}
          <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }}>{email}</Text>
        </Text>
      </View>

      <Controller
        control={control}
        name="code"
        render={({ field, fieldState }) => (
          <CodeInput
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            onSubmitEditing={handleSubmit(onSubmit)}
          />
        )}
      />

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={submitting}
        onPress={handleSubmit(onSubmit)}
      >
        Verify email
      </Button>

      <View style={{ alignItems: 'center', marginTop: v2.spacing[5] }}>
        <Button
          variant="ghost"
          size="sm"
          onPress={handleResend}
          disabled={resendDisabled}
        >
          {resendLabel}
        </Button>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: v2.spacing[3],
          gap: v2.spacing[1],
        }}
      >
        <Button variant="ghost" size="sm" onPress={() => navigation.navigate('Login')}>
          Back to sign in
        </Button>
      </View>

      <Toast ref={toastRef} />
    </ScreenScaffold>
  );
}

export default VerifyEmailScreen;
