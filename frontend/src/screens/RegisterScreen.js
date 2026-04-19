import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { authApi } from '../services/authApi';
import { useTheme } from '../context/ThemeContext';
import { Logo } from '../components/Logo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../config';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

function validateFields({ username, email, password, confirmPassword }) {
  const errors = {};
  if (!username.trim()) errors.username = 'Username is required';
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Invalid email format';
  if (!password) errors.password = 'Password is required';
  else if (password.length < PASSWORD_MIN_LENGTH)
    errors.password = `Must be at least ${PASSWORD_MIN_LENGTH} characters`;
  else if (!/[A-Z]/.test(password)) errors.password = 'Must contain at least one uppercase letter';
  else if (!/[0-9]/.test(password)) errors.password = 'Must contain at least one number';
  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (password && confirmPassword !== password)
    errors.confirmPassword = 'Passwords do not match';
  return errors;
}

export function RegisterScreen({ navigation }) {
  const { colors, fonts } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const phoneRef = useRef(null);

  const handleFieldBlur = (field) => {
    const fieldErrors = validateFields({ username, email, password, confirmPassword });
    setErrors((prev) => ({
      ...prev,
      [field]: fieldErrors[field] || undefined,
    }));
  };

  const handleRegister = async () => {
    setApiError('');
    const fieldErrors = validateFields({ username, email, password, confirmPassword });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setIsLoading(true);
    try {
      const result = await authApi.register(
        username.trim(),
        email.trim(),
        password,
        phone.trim() || null
      );

      if (result.error) {
        const msg = result.error;
        if (/email.*already/i.test(msg)) {
          setErrors((prev) => ({ ...prev, email: msg }));
          setApiError('This email is already registered. Log in instead?');
        } else if (/username.*already|username.*taken/i.test(msg)) {
          setErrors((prev) => ({ ...prev, username: msg }));
        } else if (/phone.*already/i.test(msg)) {
          setErrors((prev) => ({ ...prev, phone: msg }));
        } else {
          setApiError(msg);
        }
        return;
      }

      navigation.navigate('VerifyEmail', { email: email.trim() });
    } catch (error) {
      setApiError(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Logo size="medium" />
            <Text style={[fonts.body, { color: colors.textSecondary, marginTop: 8 }]}>
              Join the Sakina community
            </Text>
          </View>

          <View style={styles.form}>
            {apiError ? (
              <Banner
                variant="error"
                message={apiError}
                action={/already registered/i.test(apiError) ? 'Log in' : undefined}
                onAction={
                  /already registered/i.test(apiError)
                    ? () => navigation.navigate('Login')
                    : undefined
                }
              />
            ) : null}

            <Input
              label="Username"
              value={username}
              onChangeText={(t) => {
                setUsername(t);
                setErrors((p) => ({ ...p, username: undefined }));
              }}
              onBlur={() => handleFieldBlur('username')}
              placeholder="Choose a username"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              textContentType="username"
              error={errors.username}
            />

            <Input
              label="Email"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErrors((p) => ({ ...p, email: undefined }));
              }}
              onBlur={() => handleFieldBlur('email')}
              placeholder="Enter your email"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              textContentType="emailAddress"
              inputRef={emailRef}
              error={errors.email}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setErrors((p) => ({ ...p, password: undefined }));
              }}
              onBlur={() => handleFieldBlur('password')}
              placeholder="Create a password"
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              textContentType="newPassword"
              inputRef={passwordRef}
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                setErrors((p) => ({ ...p, confirmPassword: undefined }));
              }}
              onBlur={() => handleFieldBlur('confirmPassword')}
              placeholder="Re-enter your password"
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              textContentType="newPassword"
              inputRef={confirmPasswordRef}
              error={errors.confirmPassword}
            />

            <Input
              label="Phone"
              optional
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                setErrors((p) => ({ ...p, phone: undefined }));
              }}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              textContentType="telephoneNumber"
              inputRef={phoneRef}
              error={errors.phone}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              style={{ marginTop: 8 }}
            />

            <Text
              style={[
                fonts.caption,
                {
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 16,
                  lineHeight: 18,
                },
              ]}
            >
              By creating an account you agree to our{' '}
              <Text
                style={{ color: colors.primary, fontWeight: '600' }}
                onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={{ color: colors.primary, fontWeight: '600' }}
                onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
              >
                Privacy Policy
              </Text>
              .
            </Text>

            <View style={styles.footer}>
              <Text style={[fonts.body, { color: colors.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[fonts.body, { color: colors.secondary, fontWeight: '600' }]}>
                  Log in
                </Text>
              </TouchableOpacity>
            </View>
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});
