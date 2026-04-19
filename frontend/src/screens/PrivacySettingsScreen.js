import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../config';

const DATA_ITEMS = [
  {
    icon: 'journal-outline',
    title: 'Journal Entries',
    desc: 'Your mood logs, emotions, energy levels, and journal text.',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Chat Conversations',
    desc: 'Messages exchanged with the AI wellness assistant.',
  },
  {
    icon: 'notifications-outline',
    title: 'Notification Preferences',
    desc: 'Your preferred delivery time and opt-in status.',
  },
  {
    icon: 'person-outline',
    title: 'Account Information',
    desc: 'Username, email address, and hashed password.',
  },
];

export function PrivacySettingsScreen({ navigation }) {
  const { colors, fonts } = useTheme();
  const { deleteAccount } = useAuth();
  const [expanded, setExpanded] = useState(null);

  // Two-step delete flow: an intent confirmation dialog, then a password re-auth
  // modal. Apple Guideline 5.1.1(v) and Google User Data policy both require a
  // confirmation step and that deletion is reachable without contacting support.
  const [modalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState(null);

  const openDeleteFlow = () => {
    Alert.alert(
      'Delete your account?',
      'This will permanently erase your journal entries, chat conversations, community posts, and profile across Sakina. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            setPassword('');
            setErrorText(null);
            setModalVisible(true);
          },
        },
      ]
    );
  };

  const closeModal = () => {
    if (submitting) return;
    setModalVisible(false);
    setPassword('');
    setErrorText(null);
  };

  const confirmDelete = async () => {
    if (!password.trim()) {
      setErrorText('Please enter your password to confirm.');
      return;
    }
    setSubmitting(true);
    setErrorText(null);
    try {
      await deleteAccount(password);
      // After clearSession + resetOnboarding the root navigator will drop us
      // back to the first-run flow on its own. We still dismiss the modal for
      // the brief window before that re-render runs.
      setModalVisible(false);
    } catch (err) {
      setErrorText(err?.message || 'Unable to delete your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card style={{ marginBottom: 16 }}>
        <View style={styles.cardHeader}>
          <Ionicons name="server-outline" size={22} color={colors.primary} />
          <Text style={[fonts.heading3, { color: colors.text }]}>Your Data</Text>
        </View>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 12 }]}>
          Here is what we store and how your data is used.
        </Text>

        {DATA_ITEMS.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.dataRow, { borderBottomColor: colors.border }]}
            onPress={() => setExpanded(expanded === idx ? null : idx)}
            activeOpacity={0.7}
          >
            <View style={styles.dataRowHeader}>
              <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <Text style={[fonts.body, { color: colors.text, fontWeight: '600', flex: 1 }]}>
                {item.title}
              </Text>
              <Ionicons
                name={expanded === idx ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textSecondary}
              />
            </View>
            {expanded === idx && (
              <Text
                style={[
                  fonts.bodySmall,
                  { color: colors.textSecondary, marginTop: 8, marginLeft: 46, lineHeight: 19 },
                ]}
              >
                {item.desc}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <View style={styles.cardHeader}>
          <Ionicons name="document-text-outline" size={22} color={colors.primary} />
          <Text style={[fonts.heading3, { color: colors.text }]}>Privacy Policy</Text>
        </View>
        <Text style={[fonts.body, { color: colors.text, lineHeight: 22, marginBottom: 12 }]}>
          We do not sell or share your personal data with third parties. All traffic between the app
          and our servers uses HTTPS (TLS), and your password is stored as a salted BCrypt hash.
        </Text>
        <Text style={[fonts.body, { color: colors.text, lineHeight: 22, marginBottom: 12 }]}>
          AI chat conversations are processed to provide wellness support and are not used to train
          external machine learning models. You can delete your account and all associated data at
          any time using the button below.
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <Text style={[fonts.body, { color: colors.primary, fontWeight: '600' }]}>
              Read full Privacy Policy
            </Text>
          </TouchableOpacity>
          <Text style={[fonts.body, { color: colors.textSecondary }]}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}>
            <Text style={[fonts.body, { color: colors.primary, fontWeight: '600' }]}>
              Terms of Service
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-outline" size={22} color={colors.primary} />
          <Text style={[fonts.heading3, { color: colors.text }]}>Community Safety</Text>
        </View>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 12 }]}>
          Manage the users you've blocked. Blocked users can't appear in your community feeds.
        </Text>
        <TouchableOpacity
          style={[styles.linkRow, { borderColor: colors.border }]}
          onPress={() => navigation.navigate('BlockedUsers')}
          activeOpacity={0.7}
        >
          <Ionicons name="person-remove-outline" size={20} color={colors.primary} />
          <Text style={[fonts.body, { color: colors.text, fontWeight: '600', flex: 1 }]}>
            Blocked Users
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Ionicons name="warning-outline" size={22} color={colors.error} />
          <Text style={[fonts.heading3, { color: colors.error }]}>Danger Zone</Text>
        </View>
        <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 14 }]}>
          Permanently delete your account and all associated data.
        </Text>
        <Button
          variant="danger"
          title="Delete My Account"
          onPress={openDeleteFlow}
          icon={<Ionicons name="trash-outline" size={18} color={colors.error} />}
        />
      </Card>

      <View style={{ height: 32 }} />

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.surface || colors.background }]}>
            <Text style={[fonts.heading3, { color: colors.text, marginBottom: 8 }]}>
              Confirm account deletion
            </Text>
            <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginBottom: 16, lineHeight: 19 }]}>
              For your security, please re-enter your password. Once confirmed, your journal, chat
              history, community activity, and profile will be permanently erased.
            </Text>

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              placeholder="Your current password"
              error={errorText}
            />

            <View style={styles.modalActions}>
              <Button
                variant="secondary"
                title="Cancel"
                onPress={closeModal}
                disabled={submitting}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                variant="danger"
                title={submitting ? '' : 'Delete Forever'}
                onPress={confirmDelete}
                disabled={submitting}
                style={{ flex: 1, marginLeft: 8 }}
                icon={
                  submitting ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  )
                }
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dataRow: { paddingVertical: 12, borderBottomWidth: 1 },
  dataRowHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
