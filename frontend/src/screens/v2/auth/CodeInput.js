/**
 * 6-digit code input — used by ResetPassword, VerifyEmail, TwoFactor.
 * Single TextInput styled as a row of monospace digits.
 */

import React from 'react';
import { TextInput, View } from 'react-native';
import { useV2Theme } from '../../../theme/v2';
import { Text } from '../../../ui/v2';

/**
 * @param {{
 *   value: string,
 *   onChange: (v: string) => void,
 *   onBlur?: () => void,
 *   error?: string,
 *   onSubmitEditing?: () => void,
 *   testID?: string,
 *   length?: number,
 * }} props
 */
export function CodeInput({
  value,
  onChange,
  onBlur,
  error,
  onSubmitEditing,
  testID,
  length = 6,
}) {
  const v2 = useV2Theme();
  const borderColor = error ? v2.palette.error : v2.palette.border.subtle;

  return (
    <View style={{ marginBottom: v2.spacing[2] }}>
      <Text variant="label" color="secondary" style={{ marginBottom: v2.spacing[2] }}>
        VERIFICATION CODE
      </Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        onBlur={onBlur}
        onSubmitEditing={onSubmitEditing}
        placeholder={'•'.repeat(length)}
        placeholderTextColor={v2.palette.text.tertiary}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
        keyboardAppearance={v2.isDark ? 'dark' : 'light'}
        textContentType="oneTimeCode"
        testID={testID}
        style={{
          borderWidth: 1,
          borderColor,
          borderRadius: v2.radius.lg,
          backgroundColor: v2.palette.bg.surface,
          paddingHorizontal: v2.spacing[4],
          paddingVertical: v2.spacing[4],
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 28,
          letterSpacing: 12,
          textAlign: 'center',
          color: v2.palette.text.primary,
        }}
      />
      <View style={{ minHeight: 18, paddingTop: 4, paddingHorizontal: 4 }}>
        {error ? (
          <Text variant="caption" color="error">
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default CodeInput;
