import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/authApi';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';

export function ProfileSettingsScreen() {
  const { user } = useAuth();
  const { colors, fonts } = useTheme();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const validateFields = () => {
    const fieldErrors = {};
    if (!currentPassword) fieldErrors.currentPassword = 'Please enter your current password.';
    if (newPassword.length < 8)
      fieldErrors.newPassword = 'New password must be at least 8 characters.';
    if (newPassword !== confirmPassword) fieldErrors.confirmPassword = 'New passwords do not match.';
    return fieldErrors;
  };

  const handleFieldBlur = (field) => {
    const fieldErrors = validateFields();
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] || undefined }));
  };

  const handleChangePassword = async () => {
    setApiError('');
    const fieldErrors = validateFields();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setIsSaving(true);
    try {
      const result = await authApi.changePassword(
        user.email,
        currentPassword,
        newPassword,
        confirmPassword
      );
      if (result.error) {
        setApiError(result.error);
      } else {
        showToast({ message: 'Password changed successfully!', variant: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
      }
    } catch {
      setApiError('Failed to change password. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card style={{ marginBottom: 16 }}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
          <Text style={[fonts.heading3, { color: colors.text }]}>Profile Information</Text>
        </View>

        {[
          { label: 'Username', value: user?.username || 'Not set' },
          { label: 'Email', value: user?.email || 'Not set' },
          { label: 'User ID', value: user?.id || '—' },
        ].map((row, idx, arr) => (
          <View
            key={row.label}
            style={[
              styles.infoRow,
              { borderBottomColor: colors.border },
              idx === arr.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <Text style={[fonts.bodySmall, { color: colors.textSecondary }]}>{row.label}</Text>
            <Text style={[fonts.body, { color: colors.text, fontWeight: '600' }]}>{row.value}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />
          <Text style={[fonts.heading3, { color: colors.text }]}>Change Password</Text>
        </View>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 12 }]}>
          Enter your current password and choose a new one.
        </Text>

        {apiError ? <Banner variant="error" message={apiError} style={{ marginBottom: 12 }} /> : null}

        <Input
          label="Current Password"
          value={currentPassword}
          onChangeText={(t) => {
            setCurrentPassword(t);
            setErrors((p) => ({ ...p, currentPassword: undefined }));
          }}
          onBlur={() => handleFieldBlur('currentPassword')}
          placeholder="Enter current password"
          secureTextEntry
          error={errors.currentPassword}
        />
        <Input
          label="New Password"
          value={newPassword}
          onChangeText={(t) => {
            setNewPassword(t);
            setErrors((p) => ({ ...p, newPassword: undefined }));
          }}
          onBlur={() => handleFieldBlur('newPassword')}
          placeholder="At least 8 characters"
          secureTextEntry
          error={errors.newPassword}
        />
        <Input
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={(t) => {
            setConfirmPassword(t);
            setErrors((p) => ({ ...p, confirmPassword: undefined }));
          }}
          onBlur={() => handleFieldBlur('confirmPassword')}
          placeholder="Re-enter new password"
          secureTextEntry
          error={errors.confirmPassword}
        />

        <Button
          title="Update Password"
          onPress={handleChangePassword}
          loading={isSaving}
          icon={<Ionicons name="checkmark-circle" size={20} color="#fff" />}
          style={{ marginTop: 8 }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});
