import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../services/authApi';
import { useTheme } from '../context/ThemeContext';
import { Logo } from '../components/Logo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';

const PASSWORD_MIN_LENGTH = 8;

function validateFields({ code, newPassword, confirmPassword }) {
  const errors = {};
  if (!code.trim() || code.trim().length < 6) errors.code = 'Please enter the 6-digit reset code';
  if (!newPassword) errors.newPassword = 'Password is required';
  else if (newPassword.length < PASSWORD_MIN_LENGTH)
    errors.newPassword = `Must be at least ${PASSWORD_MIN_LENGTH} characters`;
  else if (!/[A-Z]/.test(newPassword))
    errors.newPassword = 'Must contain at least one uppercase letter';
  else if (!/[0-9]/.test(newPassword)) errors.newPassword = 'Must contain at least one number';
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (newPassword && confirmPassword !== newPassword)
    errors.confirmPassword = 'Passwords do not match';
  return errors;
}

export function ResetPasswordScreen({ navigation, route }) {
  const { colors, fonts } = useTheme();
  const email = route.params?.email ?? '';

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const handleFieldBlur = (field) => {
    const fieldErrors = validateFields({ code, newPassword, confirmPassword });
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] || undefined }));
  };

  const handleReset = async () => {
    setApiError('');
    const fieldErrors = validateFields({ code, newPassword, confirmPassword });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setIsLoading(true);
    try {
      const result = await authApi.resetPassword(email, code.trim(), newPassword, confirmPassword);
      if (result.error) {
        setApiError(result.error);
        return;
      }
      navigation.navigate('Login', { email, resetSuccess: true });
    } catch (error) {
      setApiError(error.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Logo size="small" showText={false} />
            <Ionicons name="lock-open" size={32} color={colors.primary} style={{ marginTop: 16 }} />
            <Text style={[fonts.heading2, { color: colors.text, marginTop: 16 }]}>
              Reset Password
            </Text>
            <Text
              style={[
                fonts.body,
                {
                  color: colors.textSecondary,
                  marginTop: 6,
                  textAlign: 'center',
                  paddingHorizontal: 16,
                },
              ]}
            >
              Enter the code sent to your email and choose a new password
            </Text>
          </View>

          <View style={styles.form}>
            {apiError ? <Banner variant="error" message={apiError} /> : null}

            <Text
              style={[fonts.caption, { color: colors.text, fontWeight: '600', marginBottom: 6 }]}
            >
              Reset Code
            </Text>
            <TextInput
              style={[
                styles.codeInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.code ? colors.error : colors.border,
                  color: colors.text,
                },
              ]}
              value={code}
              onChangeText={(t) => {
                setCode(t.replace(/[^0-9]/g, '').slice(0, 6));
                setErrors((p) => ({ ...p, code: undefined }));
              }}
              onBlur={() => handleFieldBlur('code')}
              placeholder="000000"
              placeholderTextColor={colors.textLight}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="next"
              onSubmitEditing={() => newPasswordRef.current?.focus()}
              textContentType="oneTimeCode"
            />
            {errors.code ? (
              <Text style={[fonts.caption, { color: colors.error, marginTop: 4 }]}>
                {errors.code}
              </Text>
            ) : null}

            <Input
              label="New Password"
              value={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
                setErrors((p) => ({ ...p, newPassword: undefined }));
              }}
              onBlur={() => handleFieldBlur('newPassword')}
              placeholder="Create a new password"
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              textContentType="newPassword"
              inputRef={newPasswordRef}
              error={errors.newPassword}
              style={{ marginTop: 16 }}
            />

            <Input
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                setErrors((p) => ({ ...p, confirmPassword: undefined }));
              }}
              onBlur={() => handleFieldBlur('confirmPassword')}
              placeholder="Re-enter your new password"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleReset}
              textContentType="newPassword"
              inputRef={confirmPasswordRef}
              error={errors.confirmPassword}
            />

            <Button
              title="Reset Password"
              onPress={handleReset}
              loading={isLoading}
              style={{ marginTop: 8 }}
            />

            <TouchableOpacity style={styles.footer} onPress={() => navigation.navigate('Login')}>
              <Text style={[fonts.body, { color: colors.primary, fontWeight: '600' }]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 32, paddingVertical: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  form: { width: '100%' },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: '600',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  footer: { alignItems: 'center', marginTop: 24 },
});
