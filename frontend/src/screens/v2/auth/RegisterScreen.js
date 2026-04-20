/**
 * RegisterScreen v2.
 *
 * Behavior preserved: same authApi.register signature, same navigation
 * targets, same error handling. Visual rewrite uses RHF + zod, v2 Inputs,
 * and a single ScreenScaffold with keyboardAware scrolling.
 */

import React, { useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '../../../services/authApi';
import { useV2Theme } from '../../../theme/v2';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../../config';
import {
  Button,
  Input,
  ScreenScaffold,
  ScreenHeader,
  Text,
  Toast,
} from '../../../ui/v2';

const PASSWORD_MIN = 8;

const schema = z
  .object({
    username: z.string().min(1, 'Username is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    password: z
      .string()
      .min(PASSWORD_MIN, `Must be at least ${PASSWORD_MIN} characters`)
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phone: z.string().optional().or(z.literal('')),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export function RegisterScreen({ navigation }) {
  const v2 = useV2Theme();
  const toastRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, setError } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { username: '', email: '', password: '', confirmPassword: '', phone: '' },
  });

  const onSubmit = async ({ username, email, password, phone }) => {
    setSubmitting(true);
    try {
      const result = await authApi.register(
        username.trim(),
        email.trim(),
        password,
        phone?.trim() || null
      );

      if (result?.error) {
        const msg = result.error;
        if (/email.*already/i.test(msg)) {
          setError('email', { message: msg });
          toastRef.current?.show({
            kind: 'error',
            title: 'Email already in use',
            body: 'Try signing in or use a different email.',
          });
        } else if (/username.*already|username.*taken/i.test(msg)) {
          setError('username', { message: msg });
        } else if (/phone.*already/i.test(msg)) {
          setError('phone', { message: msg });
        } else {
          toastRef.current?.show({ kind: 'error', title: 'Sign up failed', body: msg });
        }
        return;
      }

      navigation.navigate('VerifyEmail', { email: email.trim() });
    } catch (e) {
      toastRef.current?.show({
        kind: 'error',
        title: 'Sign up failed',
        body: e?.message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenScaffold
      ambient
      ambientIntensity="subtle"
      keyboardAware
      paddingHorizontal={6}
    >
      <ScreenHeader onBack={() => navigation.goBack()} />

      <View style={{ marginTop: v2.spacing[2], marginBottom: v2.spacing[6] }}>
        <Text variant="display-lg">Create account</Text>
        <Text variant="body" color="secondary" style={{ marginTop: v2.spacing[1] }}>
          A small step toward a calmer day.
        </Text>
      </View>

      <Controller
        control={control}
        name="username"
        render={({ field, fieldState }) => (
          <Input
            label="Username"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <Input
            label="Email"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="email-address"
            returnKeyType="next"
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
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field, fieldState }) => (
          <Input
            label="Phone (optional)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="phone-pad"
            returnKeyType="done"
            onSubmitEditing={handleSubmit(onSubmit)}
          />
        )}
      />

      <View style={{ marginTop: v2.spacing[3] }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel="Create account"
        >
          Create account
        </Button>
      </View>

      <Text
        variant="body-sm"
        color="secondary"
        align="center"
        style={{ marginTop: v2.spacing[5] }}
      >
        By creating an account you agree to our{' '}
        <Text
          variant="body-sm"
          style={{ color: v2.palette.primary }}
          onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
        >
          Terms
        </Text>{' '}
        and{' '}
        <Text
          variant="body-sm"
          style={{ color: v2.palette.primary }}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
        >
          Privacy Policy
        </Text>
        .
      </Text>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: v2.spacing[5],
          gap: v2.spacing[1],
        }}
      >
        <Text variant="body" color="secondary">
          Already have an account?
        </Text>
        <Button variant="ghost" size="sm" onPress={() => navigation.navigate('Login')}>
          Sign in
        </Button>
      </View>

      <Toast ref={toastRef} />
    </ScreenScaffold>
  );
}

export default RegisterScreen;
