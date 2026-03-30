import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../services/authApi';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export function ProfileSettingsScreen() {
  const { user } = useAuth();
  const { colors, fonts } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Validation', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Validation', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation', 'New passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await authApi.changePassword(
        user.email,
        currentPassword,
        newPassword,
        confirmPassword
      );
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        Alert.alert('Success', 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      Alert.alert('Error', 'Failed to change password. Please try again.');
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

        <Input
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          secureTextEntry
        />
        <Input
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="At least 8 characters"
          secureTextEntry
        />
        <Input
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter new password"
          secureTextEntry
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
