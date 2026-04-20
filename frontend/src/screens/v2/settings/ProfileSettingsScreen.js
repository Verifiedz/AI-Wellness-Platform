/**
 * ProfileSettingsScreen v2 — readonly profile info + change password form.
 *
 * Behavior preserved: authApi.changePassword(email, current, new, confirm),
 * 8-char minimum, password match validation, useToast on success.
 */

import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserCircle, Lock, CheckCircle } from 'phosphor-react-native';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { authApi } from '../../../services/authApi';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Card,
  Input,
  ScreenHeader,
  ScreenScaffold,
  Text,
  Toast,
} from '../../../ui/v2';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Please enter your current password.'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'New passwords do not match.',
    path: ['confirmPassword'],
  });

export function ProfileSettingsScreen({ navigation }) {
  const v2 = useV2Theme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const toastRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async ({ currentPassword, newPassword, confirmPassword }) => {
    setSubmitting(true);
    try {
      const result = await authApi.changePassword(
        user.email,
        currentPassword,
        newPassword,
        confirmPassword
      );
      if (result.error) {
        toastRef.current?.show({
          kind: 'error',
          title: 'Password change failed',
          body: result.error,
        });
      } else {
        showToast({ message: 'Password changed', variant: 'success' });
        reset();
      }
    } catch {
      toastRef.current?.show({
        kind: 'error',
        title: 'Password change failed',
        body: 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenScaffold ambient ambientIntensity="subtle" keyboardAware paddingBottom="tabBar">
      <ScreenHeader title="Profile" onBack={() => navigation.goBack()} />

      <Card padding={4} style={{ marginTop: v2.spacing[2], marginBottom: v2.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <UserCircle size={22} color={v2.palette.primary} weight="duotone" />
          <Text variant="h3">Profile information</Text>
        </View>
        {[
          { label: 'Username', value: user?.username || 'Not set' },
          { label: 'Email', value: user?.email || 'Not set' },
          { label: 'User ID', value: user?.id || '—' },
        ].map((row, idx, arr) => (
          <View
            key={row.label}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: idx === arr.length - 1 ? 0 : 1,
              borderBottomColor: v2.palette.border.subtle,
            }}
          >
            <Text variant="body-sm" color="secondary">{row.label}</Text>
            <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold', flex: 1, textAlign: 'right' }} numberOfLines={1}>
              {String(row.value)}
            </Text>
          </View>
        ))}
      </Card>

      <Card padding={4}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Lock size={22} color={v2.palette.primary} weight="duotone" />
          <Text variant="h3">Change password</Text>
        </View>
        <Text variant="body-sm" color="secondary" style={{ marginTop: 4, marginBottom: v2.spacing[3] }}>
          Enter your current password and choose a new one.
        </Text>

        <Controller
          control={control}
          name="currentPassword"
          render={({ field, fieldState }) => (
            <Input
              label="Current password"
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
              label="Confirm new password"
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
          leadingIcon={CheckCircle}
          onPress={handleSubmit(onSubmit)}
          style={{ marginTop: v2.spacing[2] }}
        >
          Update password
        </Button>
      </Card>

      <Toast ref={toastRef} />
    </ScreenScaffold>
  );
}

export default ProfileSettingsScreen;
