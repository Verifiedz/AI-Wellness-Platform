/**
 * ForgotPasswordScreen v2.
 * Sends a reset code, then offers to navigate to ResetPassword with the email.
 */

import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Key } from 'phosphor-react-native';
import { authApi } from '../../../services/authApi';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Input,
  ScreenScaffold,
  ScreenHeader,
  Surface,
  Text,
  Toast,
} from '../../../ui/v2';

const schema = z.object({
  email: z.string().min(1, 'Please enter your email').email('Please enter a valid email'),
});

export function ForgotPasswordScreen({ navigation }) {
  const v2 = useV2Theme();
  const toastRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { control, handleSubmit, getValues } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }) => {
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (e) {
      toastRef.current?.show({
        kind: 'error',
        title: 'Could not send reset code',
        body: e?.message || 'Please try again in a moment.',
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
          <Key size={28} color={v2.palette.primary} weight="duotone" />
        </View>
        <Text variant="display-lg" align="center">Forgot password</Text>
        <Text
          variant="body"
          color="secondary"
          align="center"
          style={{ marginTop: v2.spacing[2], maxWidth: 320 }}
        >
          {submitted
            ? 'Check your email for the 6-digit code.'
            : 'Enter your email and we\u2019ll send a reset code.'}
        </Text>
      </View>

      {submitted ? (
        <View>
          <Surface elevation="raised" padding={4} style={{ marginBottom: v2.spacing[4] }}>
            <Text variant="body">
              If an account exists for{' '}
              <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }}>
                {getValues('email')}
              </Text>
              , you\u2019ll receive instructions shortly.
            </Text>
          </Surface>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={() =>
              navigation.navigate('ResetPassword', { email: getValues('email').trim() })
            }
          >
            Enter reset code
          </Button>
        </View>
      ) : (
        <View>
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
                placeholder="you@email.com"
                keyboardType="email-address"
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
            Send reset code
          </Button>
        </View>
      )}

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
          Remembered it?
        </Text>
        <Button variant="ghost" size="sm" onPress={() => navigation.navigate('Login')}>
          Back to sign in
        </Button>
      </View>

      <Toast ref={toastRef} />
    </ScreenScaffold>
  );
}

export default ForgotPasswordScreen;
