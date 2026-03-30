import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../services/authApi';
import { useTheme } from '../context/ThemeContext';
import { Logo } from '../components/Logo';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen({ navigation }) {
  const { colors, fonts } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Logo size="small" showText={false} />
          <Ionicons name="key" size={32} color={colors.primary} style={{ marginTop: 16 }} />
          <Text style={[fonts.heading2, { color: colors.text, marginTop: 16 }]}>
            Forgot Password
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
            {submitted
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive a password reset code'}
          </Text>
        </View>

        <View style={styles.form}>
          {error ? <Banner variant="error" message={error} /> : null}

          {submitted ? (
            <>
              <Banner
                variant="success"
                message="If an account exists with this email, reset instructions have been sent."
              />
              <Button
                title="Enter Reset Code"
                onPress={() => navigation.navigate('ResetPassword', { email: email.trim() })}
              />
            </>
          ) : (
            <>
              <Input
                label="Email"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setError('');
                }}
                placeholder="Enter your email"
                keyboardType="email-address"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                textContentType="emailAddress"
              />
              <Button
                title="Send Reset Code"
                onPress={handleSubmit}
                loading={isLoading}
                style={{ marginTop: 8 }}
              />
            </>
          )}

          <TouchableOpacity style={styles.footer} onPress={() => navigation.navigate('Login')}>
            <Text style={[fonts.body, { color: colors.primary, fontWeight: '600' }]}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  header: { alignItems: 'center', marginBottom: 32 },
  form: { width: '100%' },
  footer: { alignItems: 'center', marginTop: 24 },
});
