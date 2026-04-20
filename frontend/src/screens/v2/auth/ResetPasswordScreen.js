/**
 * ResetPasswordScreen v2 — reset code + new password + confirm.
 */

import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LockOpen } from 'phosphor-react-native';
import { authApi } from '../../../services/authApi';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Input,
  ScreenScaffold,
  ScreenHeader,
  Text,
  Toast,
} from '../../../ui/v2';
import { CodeInput } from './CodeInput';

const PASSWORD_MIN = 8;

const schema = z
  .object({
    code: z.string().length(6, 'Enter the 6-digit code'),
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `Must be at least ${PASSWORD_MIN} characters`)
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export function ResetPasswordScreen({ navigation, route }) {
  const v2 = useV2Theme();
  const toastRef = useRef(null);
  const email = route?.params?.email ?? '';
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async ({ code, newPassword, confirmPassword }) => {
    setSubmitting(true);
    try {
      const result = await authApi.resetPassword(email, code.trim(), newPassword, confirmPassword);
      if (result?.error) {
        toastRef.current?.show({
          kind: 'error',
          title: 'Reset failed',
          body: result.error,
        });
        return;
      }
      navigation.navigate('Login', { email, resetSuccess: true });
    } catch (e) {
      toastRef.current?.show({
        kind: 'error',
        title: 'Reset failed',
        body: e?.message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

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
          <LockOpen size={28} color={v2.palette.primary} weight="duotone" />
        </View>
        <Text variant="display-lg" align="center">Reset password</Text>
        <Text
          variant="body"
          color="secondary"
          align="center"
          style={{ marginTop: v2.spacing[2], maxWidth: 320 }}
        >
          Enter the code we sent to{' '}
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
          />
        )}
      />

      <Controller
        control={control}
        name="newPassword"
        render={({ field, fieldState }) => (
          <Input
            label="New password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            secureTextEntry
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <Input
            label="Confirm password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            secureTextEntry
            returnKeyType="done"
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
        Reset password
      </Button>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: v2.spacing[6],
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

export default ResetPasswordScreen;
