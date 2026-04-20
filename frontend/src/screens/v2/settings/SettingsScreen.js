/**
 * SettingsScreen v2 — primary settings hub.
 *
 * Behavior preserved end-to-end:
 *   - useFocusEffect-based stats load (journal entries + chat sessions + streak)
 *   - logout via useAuth.logout with confirmation Alert
 *   - resetOnboarding via useOnboarding
 *   - Linking external URLs through canOpenURL guard
 *   - All navigation targets unchanged (ProfileSettings / NotificationSettings /
 *     ExportData / WearableSettings / PrivacySettings / HelpSupport /
 *     ProfessionalDirectory)
 *
 * Visual rewrite: ScreenScaffold + ambient aurora, Avatar with initials, stats
 * tiles in v2 Cards, SettingsSection + SettingsRow primitives, Phosphor icons.
 */

import React, { useCallback, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format, subDays } from 'date-fns';
import {
  User,
  Bell,
  Export,
  Heartbeat,
  Sparkle,
  Shield,
  Question,
  UsersThree,
  Lock,
  Article,
  Moon,
  Sun,
  Clock,
  Palette,
  SignOut,
} from 'phosphor-react-native';
import { useAuth } from '../../../context/AuthContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useTheme } from '../../../context/ThemeContext';
import { DEV_MODE, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../../config';
import { journalApi } from '../../../services/journalApi';
import { chatApi } from '../../../services/chatApi';
import { AccentPicker } from '../../../components/AccentPicker';
import { useV2Theme } from '../../../theme/v2';
import {
  Avatar,
  Button,
  Card,
  ScreenHeader,
  ScreenScaffold,
  Text,
} from '../../../ui/v2';
import { SettingsRow, SettingsSection, SettingsSwitch } from './SettingsRow';

export function SettingsScreen({ navigation }) {
  const v2 = useV2Theme();
  const { user, logout } = useAuth();
  const {
    isDarkMode,
    setDarkMode,
    isDynamicTheme,
    setDynamicTheme,
    accentId,
    setAccentId,
  } = useTheme();
  const { resetOnboarding } = useOnboarding();
  const [stats, setStats] = useState({ entries: 0, sessions: 0, streak: 0 });

  const loadStats = useCallback(async () => {
    try {
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), 365), 'yyyy-MM-dd');
      const [entriesResult, sessionsResult] = await Promise.all([
        journalApi.getEntries({ startDate, endDate, limit: 365 }),
        chatApi.getSessions(),
      ]);
      let streak = 0;
      if (!entriesResult.error && entriesResult.data?.length) {
        const dates = new Set(entriesResult.data.map((e) => e.entryDate));
        let cur = new Date();
        while (dates.has(format(cur, 'yyyy-MM-dd'))) {
          streak++;
          cur = subDays(cur, 1);
        }
      }
      setStats({
        entries: entriesResult.data?.length || 0,
        sessions: sessionsResult.data?.length || 0,
        streak,
      });
    } catch {
      // Silent — stats are decorative.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', onPress: logout, style: 'destructive' },
    ]);
  };

  const openExternalUrl = useCallback(async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Cannot open link', url);
    } catch {
      Alert.alert('Cannot open link', url);
    }
  }, []);

  const handleResetOnboarding = () => {
    Alert.alert(
      'Retake setup quiz',
      'This will reset your preferences and restart the onboarding quiz. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', onPress: resetOnboarding },
      ]
    );
  };

  const displayName = user?.username || user?.email?.split('@')[0] || 'You';

  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="You" />

      <Card padding={4} style={{ marginBottom: v2.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[4] }}>
          <Avatar initials={displayName} size="lg" ring />
          <View style={{ flex: 1 }}>
            <Text variant="h2" numberOfLines={1}>
              {displayName}
            </Text>
            <Text variant="body-sm" color="secondary" numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: v2.spacing[2], marginBottom: v2.spacing[4] }}>
        {[
          { value: stats.streak, label: 'Day streak' },
          { value: stats.entries, label: 'Entries' },
          { value: stats.sessions, label: 'Chats' },
        ].map((stat) => (
          <Card key={stat.label} padding={3} style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="h2" style={{ color: v2.palette.primary }}>
              {stat.value}
            </Text>
            <Text variant="caption" color="tertiary">
              {stat.label}
            </Text>
          </Card>
        ))}
      </View>

      {/* Appearance */}
      <SettingsSection title="APPEARANCE">
        <SettingsRow
          leadingIcon={isDarkMode ? Moon : Sun}
          title="Dark mode"
          sublabel="Use a darker palette"
          right={
            <SettingsSwitch value={isDarkMode} onChange={setDarkMode} accessibilityLabel="Dark mode" />
          }
        />
        <SettingsRow
          leadingIcon={Clock}
          title="Dynamic theme"
          sublabel="Colors shift by time of day"
          right={
            <SettingsSwitch
              value={isDynamicTheme}
              onChange={setDynamicTheme}
              accessibilityLabel="Dynamic theme"
            />
          }
        />
        <View style={{ paddingHorizontal: v2.spacing[4], paddingVertical: v2.spacing[3] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: v2.palette.bg.surfaceHigh,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Palette size={20} color={v2.palette.primary} weight="duotone" />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="body" style={{ fontFamily: 'DMSans_500Medium' }}>
                Accent color
              </Text>
              <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                Choose your theme color
              </Text>
            </View>
          </View>
          <AccentPicker selectedId={accentId} onSelect={setAccentId} />
        </View>
      </SettingsSection>

      {/* Account */}
      <SettingsSection title="ACCOUNT">
        <SettingsRow
          leadingIcon={User}
          title="Profile"
          showCaret
          onPress={() => navigation.navigate('ProfileSettings')}
        />
        <SettingsRow
          leadingIcon={Bell}
          title="Notifications"
          showCaret
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        <SettingsRow
          leadingIcon={Export}
          title="Export for therapist"
          sublabel="Download wellness report"
          showCaret
          onPress={() => navigation.navigate('ExportData')}
        />
        <SettingsRow
          leadingIcon={Heartbeat}
          title="Health data"
          sublabel="Coming soon — requires native build"
          showCaret
          onPress={() => navigation.navigate('WearableSettings')}
        />
        <SettingsRow
          leadingIcon={Sparkle}
          title="Retake setup quiz"
          sublabel="Redo the onboarding questions"
          showCaret
          onPress={handleResetOnboarding}
        />
      </SettingsSection>

      {/* Support */}
      <SettingsSection title="SUPPORT">
        <SettingsRow
          leadingIcon={Shield}
          title="Privacy"
          showCaret
          onPress={() => navigation.navigate('PrivacySettings')}
        />
        <SettingsRow
          leadingIcon={Question}
          title="Help & support"
          showCaret
          onPress={() => navigation.navigate('HelpSupport')}
        />
        <SettingsRow
          leadingIcon={UsersThree}
          title="Find a professional"
          sublabel="Mental health professionals & resources"
          showCaret
          onPress={() => navigation.navigate('ProfessionalDirectory')}
        />
        <SettingsRow
          leadingIcon={Lock}
          title="Privacy policy"
          sublabel="How we handle your data"
          showCaret
          onPress={() => openExternalUrl(PRIVACY_POLICY_URL)}
        />
        <SettingsRow
          leadingIcon={Article}
          title="Terms of service"
          sublabel="Rules for using Sakina"
          showCaret
          onPress={() => openExternalUrl(TERMS_OF_SERVICE_URL)}
        />
      </SettingsSection>

      {DEV_MODE ? (
        <Text variant="caption" color="tertiary" align="center" style={{ marginBottom: v2.spacing[3] }}>
          Dev mode active
        </Text>
      ) : null}

      <Button
        variant="ghost"
        size="md"
        fullWidth
        leadingIcon={SignOut}
        onPress={handleLogout}
        haptic="warn"
      >
        Log out
      </Button>
    </ScreenScaffold>
  );
}

export default SettingsScreen;
