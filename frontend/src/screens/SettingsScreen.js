import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format, subDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOnboarding } from '../context/OnboardingContext';
import { DEV_MODE, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../config';
import { journalApi } from '../services/journalApi';
import { chatApi } from '../services/chatApi';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AnimatedCard } from '../components/AnimatedCard';
import { AccentPicker } from '../components/AccentPicker';

export function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const {
    colors,
    fonts,
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
      // Stats load failed silently
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', onPress: logout, style: 'destructive' },
    ]);
  };

  const openExternalUrl = useCallback(async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot open link', url);
      }
    } catch {
      Alert.alert('Cannot open link', url);
    }
  }, []);

  const handleResetOnboarding = () => {
    Alert.alert(
      'Retake Setup Quiz',
      'This will reset your preferences and restart the onboarding quiz. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', onPress: resetOnboarding },
      ]
    );
  };

  const menuSections = [
    {
      title: 'Appearance',
      items: [
        {
          icon: isDarkMode ? 'moon' : 'sunny',
          label: 'Dark Mode',
          sublabel: 'Use a darker color theme',
          color: colors.warning,
          trailing: (
            <Switch
              value={isDarkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isDarkMode ? colors.primary : '#f4f3f4'}
              ios_backgroundColor={colors.border}
            />
          ),
        },
        {
          icon: 'time-outline',
          label: 'Dynamic Theme',
          sublabel: 'Colors shift by time of day',
          color: colors.accent,
          trailing: (
            <Switch
              value={isDynamicTheme}
              onValueChange={setDynamicTheme}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isDynamicTheme ? colors.primary : '#f4f3f4'}
              ios_backgroundColor={colors.border}
            />
          ),
        },
        {
          icon: 'color-palette-outline',
          label: 'Accent Color',
          sublabel: 'Choose your theme color',
          color: colors.primary,
          trailing: null,
          customContent: <AccentPicker selectedId={accentId} onSelect={setAccentId} />,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          label: 'Profile',
          color: colors.secondary,
          screen: 'ProfileSettings',
        },
        {
          icon: 'notifications-outline',
          label: 'Notifications',
          color: colors.primary,
          screen: 'NotificationSettings',
        },
        {
          icon: 'document-text-outline',
          label: 'Export for Therapist',
          sublabel: 'Download wellness report',
          color: colors.success,
          screen: 'ExportData',
        },
        {
          icon: 'fitness-outline',
          label: 'Health Data',
          sublabel: 'Coming soon — requires native build',
          color: colors.error,
          screen: 'WearableSettings',
        },
        {
          icon: 'refresh-outline',
          label: 'Retake Setup Quiz',
          sublabel: 'Redo the onboarding questions',
          color: colors.accent,
          onPress: handleResetOnboarding,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'shield-outline',
          label: 'Privacy',
          color: colors.accent,
          screen: 'PrivacySettings',
        },
        {
          icon: 'help-circle-outline',
          label: 'Help & Support',
          color: colors.textSecondary,
          screen: 'HelpSupport',
        },
        {
          icon: 'people-outline',
          label: 'Find a Professional',
          sublabel: 'Mental health professionals & resources',
          color: colors.primary,
          screen: 'ProfessionalDirectory',
        },
        {
          icon: 'lock-closed-outline',
          label: 'Privacy Policy',
          sublabel: 'How we handle your data',
          color: colors.accent,
          onPress: () => openExternalUrl(PRIVACY_POLICY_URL),
        },
        {
          icon: 'reader-outline',
          label: 'Terms of Service',
          sublabel: 'Rules for using Sakina',
          color: colors.textSecondary,
          onPress: () => openExternalUrl(TERMS_OF_SERVICE_URL),
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Profile card */}
      <AnimatedCard index={0}>
        <Card style={styles.profileCard}>
          <Avatar name={user?.username || user?.email} size={64} />
          <View style={styles.profileInfo}>
            <Text style={[fonts.heading2, { color: colors.text }]}>
              {user?.username || user?.email || 'User'}
            </Text>
            <Text style={[fonts.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
              {user?.email}
            </Text>
          </View>
        </Card>
      </AnimatedCard>

      {/* Stats tiles */}
      <AnimatedCard index={1}>
        <View style={styles.statsRow}>
          {[
            { value: stats.streak, label: 'Day Streak' },
            { value: stats.entries, label: 'Entries' },
            { value: stats.sessions, label: 'Chats' },
          ].map((stat) => (
            <Card key={stat.label} style={styles.statTile}>
              <Text style={[fonts.heading2, { color: colors.primary }]}>{stat.value}</Text>
              <Text style={[fonts.caption, { color: colors.textSecondary }]}>{stat.label}</Text>
            </Card>
          ))}
        </View>
      </AnimatedCard>

      {/* Menu sections */}
      {menuSections.map((section, sIdx) => (
        <AnimatedCard key={section.title} index={sIdx + 2}>
          <View style={{ marginBottom: 16 }}>
            <Text
              style={[
                fonts.caption,
                {
                  color: colors.textSecondary,
                  marginBottom: 8,
                  marginLeft: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                },
              ]}
            >
              {section.title}
            </Text>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {section.items.map((item, idx) => (
                <View key={item.label}>
                  <TouchableOpacity
                    style={[
                      styles.menuRow,
                      { borderBottomColor: colors.border },
                      idx === section.items.length - 1 &&
                        !item.customContent && { borderBottomWidth: 0 },
                    ]}
                    onPress={
                      item.onPress ||
                      (item.screen ? () => navigation.navigate(item.screen) : undefined)
                    }
                    activeOpacity={item.onPress || item.screen ? 0.7 : 1}
                    disabled={!item.onPress && !item.screen}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                      <Ionicons name={item.icon} size={20} color={item.color} />
                    </View>
                    <View style={styles.menuText}>
                      <Text style={[fonts.body, { color: colors.text }]}>{item.label}</Text>
                      {item.sublabel && (
                        <Text style={[fonts.caption, { color: colors.textSecondary }]}>
                          {item.sublabel}
                        </Text>
                      )}
                    </View>
                    {item.trailing ||
                      ((item.screen || item.onPress) && (
                        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                      ))}
                  </TouchableOpacity>
                  {item.customContent && (
                    <View
                      style={[
                        {
                          paddingHorizontal: 16,
                          paddingBottom: 12,
                          borderBottomColor: colors.border,
                        },
                        idx === section.items.length - 1 ? {} : { borderBottomWidth: 1 },
                      ]}
                    >
                      {item.customContent}
                    </View>
                  )}
                </View>
              ))}
            </Card>
          </View>
        </AnimatedCard>
      ))}

      {DEV_MODE && (
        <Text
          style={[
            fonts.caption,
            { color: colors.textLight, textAlign: 'center', marginBottom: 16 },
          ]}
        >
          Dev Mode Active
        </Text>
      )}

      <Button
        variant="danger"
        title="Log Out"
        onPress={handleLogout}
        icon={<Ionicons name="log-out-outline" size={18} color={colors.error} />}
      />

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  profileInfo: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statTile: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { flex: 1 },
});
