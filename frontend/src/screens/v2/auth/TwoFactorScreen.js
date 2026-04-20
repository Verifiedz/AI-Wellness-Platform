/**
 * TwoFactorScreen v2 — 6-digit code + countdown to expiry.
 */

import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Clock } from 'phosphor-react-native';
import { useAuth } from '../../../context/AuthContext';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  ScreenScaffold,
  ScreenHeader,
  Surface,
  Text,
  Toast,
} from '../../../ui/v2';
import { CodeInput } from './CodeInput';

const schema = z.object({
  code: z.string().length(6, 'Enter the 6-digit code'),
});

function formatTime(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function TwoFactorScreen({ navigation, route }) {
  const v2 = useV2Theme();
  const toastRef = useRef(null);
  const { verifyTwoFactor } = useAuth();
  const email = route?.params?.email ?? '';
  const serverMessage = route?.params?.message ?? '';
  const expiresAt = route?.params?.expiresAt ?? null;

  const [submitting, setSubmitting] = useState(false);
  const [expirySeconds, setExpirySeconds] = useState(null);
  const expiryRef = useRef(null);

  useEffect(() => {
    if (!expiresAt) return undefined;
    const calc = () =>
      Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));

    setExpirySeconds(calc());
    expiryRef.current = setInterval(() => {
      const remaining = calc();
      setExpirySeconds(remaining);
      if (remaining <= 0 && expiryRef.current) clearInterval(expiryRef.current);
    }, 1000);

    return () => {
      if (expiryRef.current) clearInterval(expiryRef.current);
    };
  }, [expiresAt]);

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { code: '' },
  });

  const onSubmit = async ({ code }) => {
    setSubmitting(true);
    try {
      await verifyTwoFactor(email, code.trim());
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

  return (
    <ScreenScaffold ambient ambientIntensity="subtle" keyboardAware paddingHorizontal={6}>
      <ScreenHeader onBack={() => navigation.navigate('Login')} />

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
          <ShieldCheck size={28} color={v2.palette.primary} weight="duotone" />
        </View>
        <Text variant="display-lg" align="center">Two-factor</Text>
        <Text
          variant="body"
          color="secondary"
          align="center"
          style={{ marginTop: v2.spacing[2], maxWidth: 320 }}
        >
          {serverMessage || 'Enter the verification code sent to your device.'}
        </Text>
      </View>

      {expirySeconds !== null ? (
        <Surface
          elevation="raised"
          padding={3}
          style={{ marginBottom: v2.spacing[3], flexDirection: 'row', alignItems: 'center' }}
        >
          <Clock
            size={20}
            color={expirySeconds <= 0 ? v2.palette.error : v2.palette.warning}
            weight="duotone"
          />
          <Text
            variant="body-sm"
            color={expirySeconds <= 0 ? 'error' : 'secondary'}
            style={{ marginLeft: v2.spacing[2] }}
          >
            {expirySeconds <= 0
              ? 'Code expired. Sign in again to request a new one.'
              : `Code expires in ${formatTime(expirySeconds)}`}
          </Text>
        </Surface>
      ) : null}

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
        disabled={expirySeconds !== null && expirySeconds <= 0}
      >
        Verify
      </Button>

      <View style={{ alignItems: 'center', marginTop: v2.spacing[5] }}>
        <Button variant="ghost" size="sm" onPress={() => navigation.navigate('Login')}>
          Back to sign in
        </Button>
      </View>

      <Toast ref={toastRef} />
    </ScreenScaffold>
  );
}

export default TwoFactorScreen;
