/**
 * PrivacySettingsScreen v2 — data summary + privacy policy + safety + delete-account flow.
 *
 * Behavior preserved end-to-end:
 *   - useAuth.deleteAccount(password) two-step flow with re-auth modal
 *   - Apple Guideline 5.1.1(v) + Google User Data policy compliance preserved
 *   - Linking.openURL for PRIVACY_POLICY_URL / TERMS_OF_SERVICE_URL
 *   - Navigation to BlockedUsers preserved
 */

import React, { useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import {
  Database,
  Notebook,
  ChatsCircle,
  Bell,
  User,
  Article,
  Shield,
  UserMinus,
  Warning,
  Trash,
} from 'phosphor-react-native';
import { useAuth } from '../../../context/AuthContext';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../../config';
import { useV2Theme } from '../../../theme/v2';
import {
  Button,
  Card,
  Input,
  ScreenHeader,
  ScreenScaffold,
  Sheet,
  Text,
  Toast,
} from '../../../ui/v2';
import { SettingsRow, SettingsSection } from './SettingsRow';

const DATA_ITEMS = [
  { Icon: Notebook, title: 'Journal entries', desc: 'Mood logs, emotions, energy, journal text.' },
  { Icon: ChatsCircle, title: 'Chat conversations', desc: 'Messages with the AI wellness assistant.' },
  { Icon: Bell, title: 'Notification preferences', desc: 'Preferred delivery time and opt-in status.' },
  { Icon: User, title: 'Account information', desc: 'Username, email, hashed password.' },
];

export function PrivacySettingsScreen({ navigation }) {
  const v2 = useV2Theme();
  const { deleteAccount } = useAuth();
  const deleteSheet = useRef(null);
  const toastRef = useRef(null);
  const [expanded, setExpanded] = useState(null);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const openDeleteFlow = () => {
    setPassword('');
    setError('');
    deleteSheet.current?.present();
  };

  const confirmDelete = async () => {
    if (!password.trim()) {
      setError('Please enter your password to confirm.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await deleteAccount(password);
      deleteSheet.current?.dismiss();
    } catch (err) {
      setError(err?.message || 'Unable to delete your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="Privacy" onBack={() => navigation.goBack()} />

      {/* Data summary */}
      <Card padding={4} style={{ marginTop: v2.spacing[2], marginBottom: v2.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Database size={22} color={v2.palette.primary} weight="duotone" />
          <Text variant="h3">Your data</Text>
        </View>
        <Text variant="body-sm" color="secondary" style={{ marginTop: 4 }}>
          Here is what we store and how it is used.
        </Text>
        <View style={{ marginTop: v2.spacing[3] }}>
          {DATA_ITEMS.map((item, idx) => {
            const isOpen = expanded === idx;
            return (
              <View
                key={item.title}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: idx === DATA_ITEMS.length - 1 ? 0 : 1,
                  borderBottomColor: v2.palette.border.subtle,
                }}
              >
                <SettingsRow
                  leadingIcon={item.Icon}
                  title={item.title}
                  onPress={() => setExpanded(isOpen ? null : idx)}
                />
                {isOpen ? (
                  <Text
                    variant="body-sm"
                    color="secondary"
                    style={{
                      marginTop: 4,
                      marginLeft: v2.spacing[4] + 36 + 12,
                      paddingRight: v2.spacing[4],
                      lineHeight: 20,
                    }}
                  >
                    {item.desc}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      </Card>

      {/* Privacy policy summary */}
      <Card padding={4} style={{ marginBottom: v2.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Article size={22} color={v2.palette.primary} weight="duotone" />
          <Text variant="h3">Privacy policy</Text>
        </View>
        <Text variant="body" color="secondary" style={{ marginTop: v2.spacing[2], lineHeight: 22 }}>
          We do not sell or share your personal data with third parties. All traffic uses HTTPS, and
          your password is stored as a salted BCrypt hash.
        </Text>
        <Text variant="body" color="secondary" style={{ marginTop: v2.spacing[2], lineHeight: 22 }}>
          AI chat conversations are processed to provide wellness support and are not used to train
          external machine learning models.
        </Text>
        <View style={{ flexDirection: 'row', gap: v2.spacing[3], marginTop: v2.spacing[3] }}>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          >
            Read full policy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}
          >
            Terms of service
          </Button>
        </View>
      </Card>

      {/* Community safety */}
      <Card padding={4} style={{ marginBottom: v2.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Shield size={22} color={v2.palette.primary} weight="duotone" />
          <Text variant="h3">Community safety</Text>
        </View>
        <Text variant="body-sm" color="secondary" style={{ marginTop: 4, marginBottom: v2.spacing[3] }}>
          Manage the users you have blocked. Blocked users can\u2019t appear in your community feeds.
        </Text>
        <SettingsSection>
          <SettingsRow
            leadingIcon={UserMinus}
            title="Blocked users"
            showCaret
            onPress={() => navigation.navigate('BlockedUsers')}
          />
        </SettingsSection>
      </Card>

      {/* Danger zone */}
      <Card padding={4}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Warning size={22} color={v2.palette.error} weight="duotone" />
          <Text variant="h3" style={{ color: v2.palette.error }}>
            Danger zone
          </Text>
        </View>
        <Text variant="body-sm" color="secondary" style={{ marginTop: 4, marginBottom: v2.spacing[3] }}>
          Permanently delete your account and all associated data.
        </Text>
        <Button variant="destructive" leadingIcon={Trash} fullWidth onPress={openDeleteFlow}>
          Delete my account
        </Button>
      </Card>

      <Sheet ref={deleteSheet} snapPoints={['55%']}>
        <View style={{ paddingTop: v2.spacing[2], gap: v2.spacing[3] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
            <Warning size={22} color={v2.palette.error} weight="duotone" />
            <Text variant="h2">Confirm account deletion</Text>
          </View>
          <Text variant="body-sm" color="secondary" style={{ lineHeight: 20 }}>
            For your security, please re-enter your password. Once confirmed, your journal, chat
            history, community activity, and profile will be permanently erased.
          </Text>
          <Input
            label="Password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) setError('');
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            error={error || undefined}
            returnKeyType="done"
            onSubmitEditing={confirmDelete}
          />
          <View style={{ flexDirection: 'row', gap: v2.spacing[2] }}>
            <Button
              variant="secondary"
              size="lg"
              style={{ flex: 1 }}
              onPress={() => deleteSheet.current?.dismiss()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="lg"
              style={{ flex: 1 }}
              loading={submitting}
              leadingIcon={Trash}
              onPress={confirmDelete}
              haptic="warn"
            >
              Delete forever
            </Button>
          </View>
        </View>
      </Sheet>

      <Toast ref={toastRef} />
    </ScreenScaffold>
  );
}

export default PrivacySettingsScreen;
