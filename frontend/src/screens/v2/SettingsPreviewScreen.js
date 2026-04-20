/**
 * Wave D.8 verification — composes settings primitives with fixtures.
 * Mounted at /?settingspreview=1&screen=hub|profile|notifications|privacy|wearable|blocked|help|export
 */

import React, { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
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
  UserCircle,
  CheckCircle,
  Globe,
  CaretUp,
  CaretDown,
  ShieldCheck,
  Eye,
  Download,
  ClipboardText,
  Heart,
  Notebook,
  Lifebuoy,
  Envelope,
  Info,
  PaperPlaneTilt,
  Warning,
  Footprints,
  XCircle,
  UserMinus,
  Trash,
} from 'phosphor-react-native';
import { useV2Theme } from '../../theme/v2';
import { useTheme } from '../../context/ThemeContext';
import { ToastProvider } from '../../context/ToastContext';
import {
  Avatar,
  Button,
  Card,
  Chip,
  IconButton,
  Input,
  ScreenHeader,
  ScreenScaffold,
  Surface,
  Text,
} from '../../ui/v2';
import { SettingsRow, SettingsSection, SettingsSwitch } from './settings/SettingsRow';

const SCREENS = {
  hub: 'Hub',
  profile: 'Profile',
  notifications: 'Notif',
  privacy: 'Privacy',
  wearable: 'Health',
  blocked: 'Blocked',
  help: 'Help',
  export: 'Export',
};

function getInitial() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'hub';
  const params = new URLSearchParams(window.location.search);
  return params.get('screen') || 'hub';
}

export function SettingsPreviewScreen() {
  const v2 = useV2Theme();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [screen, setScreen] = useState(getInitial);

  return (
    <ToastProvider>
      <View style={{ flex: 1, backgroundColor: v2.palette.bg.base }}>
        {screen === 'hub' ? <HubPreview v2={v2} /> : null}
        {screen === 'profile' ? <ProfilePreview v2={v2} /> : null}
        {screen === 'notifications' ? <NotificationsPreview v2={v2} /> : null}
        {screen === 'privacy' ? <PrivacyPreview v2={v2} /> : null}
        {screen === 'wearable' ? <WearablePreview v2={v2} /> : null}
        {screen === 'blocked' ? <BlockedPreview v2={v2} /> : null}
        {screen === 'help' ? <HelpPreview v2={v2} /> : null}
        {screen === 'export' ? <ExportPreview v2={v2} /> : null}

        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'center' }}
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 4,
              backgroundColor: v2.palette.bg.elevated,
              borderColor: v2.palette.border.subtle,
              borderWidth: 1,
              borderRadius: v2.radius.full,
              paddingHorizontal: 6,
              paddingVertical: 4,
              maxWidth: 560,
              justifyContent: 'center',
            }}
          >
            {Object.entries(SCREENS).map(([k, label]) => {
              const active = k === screen;
              return (
                <Pressable
                  key={k}
                  onPress={() => setScreen(k)}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${label}`}
                  accessibilityState={{ selected: active }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: active ? v2.palette.primary : 'transparent',
                  }}
                >
                  <Text
                    variant="label"
                    style={{
                      color: active ? v2.palette.text.onPrimary : v2.palette.text.secondary,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={toggleDarkMode}
              accessibilityRole="button"
              accessibilityLabel="Toggle theme"
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: v2.palette.bg.surface,
              }}
            >
              <Text variant="label">{isDarkMode ? 'DARK' : 'LIGHT'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ToastProvider>
  );
}

function HubPreview({ v2 }) {
  const [darkMode, setDarkMode] = useState(true);
  const [dynamicTheme, setDynamicTheme] = useState(false);
  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="You" />

      <Card padding={4} style={{ marginBottom: v2.spacing[3], marginTop: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[4] }}>
          <Avatar initials="Aria" size="lg" ring />
          <View style={{ flex: 1 }}>
            <Text variant="h2" numberOfLines={1}>
              Aria
            </Text>
            <Text variant="body-sm" color="secondary" numberOfLines={1}>
              aria@sakina.app
            </Text>
          </View>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: v2.spacing[2], marginBottom: v2.spacing[4] }}>
        {[
          { value: 12, label: 'Day streak' },
          { value: 84, label: 'Entries' },
          { value: 27, label: 'Chats' },
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

      <SettingsSection title="APPEARANCE">
        <SettingsRow
          leadingIcon={darkMode ? Moon : Sun}
          title="Dark mode"
          sublabel="Use a darker palette"
          right={
            <SettingsSwitch value={darkMode} onChange={setDarkMode} accessibilityLabel="Dark mode" />
          }
        />
        <SettingsRow
          leadingIcon={Clock}
          title="Dynamic theme"
          sublabel="Colors shift by time of day"
          right={
            <SettingsSwitch
              value={dynamicTheme}
              onChange={setDynamicTheme}
              accessibilityLabel="Dynamic theme"
            />
          }
        />
        <SettingsRow leadingIcon={Palette} title="Accent color" sublabel="Choose your theme color" showCaret />
      </SettingsSection>

      <SettingsSection title="ACCOUNT">
        <SettingsRow leadingIcon={User} title="Profile" showCaret />
        <SettingsRow leadingIcon={Bell} title="Notifications" showCaret />
        <SettingsRow leadingIcon={Export} title="Export for therapist" sublabel="Download wellness report" showCaret />
        <SettingsRow leadingIcon={Heartbeat} title="Health data" sublabel="Connect wearable (coming soon)" showCaret />
      </SettingsSection>

      <SettingsSection title="SUPPORT">
        <SettingsRow leadingIcon={UsersThree} title="Find a professional" showCaret />
        <SettingsRow leadingIcon={Shield} title="Privacy" showCaret />
        <SettingsRow leadingIcon={Question} title="Help & support" showCaret />
        <SettingsRow leadingIcon={Sparkle} title="Retake setup quiz" showCaret />
      </SettingsSection>

      <SettingsSection title="LEGAL">
        <SettingsRow leadingIcon={Article} title="Privacy policy" showCaret />
        <SettingsRow leadingIcon={Article} title="Terms of service" showCaret />
        <SettingsRow leadingIcon={Lock} title="Privacy controls" showCaret />
      </SettingsSection>

      <View style={{ marginTop: v2.spacing[4] }}>
        <Button variant="ghost" size="lg" fullWidth leadingIcon={SignOut} haptic="warn">
          Log out
        </Button>
      </View>
    </ScreenScaffold>
  );
}

function ProfilePreview({ v2 }) {
  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="Profile" onBack={() => {}} />

      <Card padding={4} style={{ marginBottom: v2.spacing[3], marginTop: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[3] }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: v2.palette.bg.surfaceHigh,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserCircle size={22} color={v2.palette.primary} weight="duotone" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="h3">Account</Text>
            <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
              Read-only profile information
            </Text>
          </View>
        </View>
        <View style={{ marginTop: v2.spacing[3], gap: v2.spacing[2] }}>
          {[
            { label: 'Username', value: 'aria' },
            { label: 'Email', value: 'aria@sakina.app' },
          ].map((row, idx, arr) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: idx === arr.length - 1 ? 0 : 1,
                borderBottomColor: v2.palette.border.subtle,
              }}
            >
              <Text variant="body-sm" color="secondary">
                {row.label}
              </Text>
              <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card padding={4}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[3] }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: v2.palette.bg.surfaceHigh,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={22} color={v2.palette.primary} weight="duotone" />
          </View>
          <Text variant="h3">Change password</Text>
        </View>
        <View style={{ marginTop: v2.spacing[3], gap: v2.spacing[3] }}>
          <Input label="Current password" placeholder="Enter current password" secureTextEntry />
          <Input label="New password" placeholder="Min 8 characters" secureTextEntry />
          <Input label="Confirm new password" placeholder="Re-enter new password" secureTextEntry />
          <Button variant="primary" size="lg" fullWidth leadingIcon={CheckCircle}>
            Update password
          </Button>
        </View>
      </Card>
    </ScreenScaffold>
  );
}

function NotificationsPreview({ v2 }) {
  const [enabled, setEnabled] = useState(true);
  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="Notifications" onBack={() => {}} />

      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginTop: 40,
          marginBottom: v2.spacing[3],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: v2.spacing[2],
        }}
      >
        <Bell size={20} color={v2.palette.primary} weight="duotone" />
        <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
          Daily wellness tips arrive at your chosen time. You can pause them any time.
        </Text>
      </Surface>

      <SettingsSection title="DAILY TIPS">
        <SettingsRow
          leadingIcon={Bell}
          title="Daily wellness tips"
          sublabel={enabled ? 'On' : 'Off'}
          right={
            <SettingsSwitch
              value={enabled}
              onChange={setEnabled}
              accessibilityLabel="Daily tips"
            />
          }
        />
      </SettingsSection>

      {enabled ? (
        <Card padding={4} style={{ marginTop: v2.spacing[3] }}>
          <Text variant="label" color="secondary" style={{ marginBottom: v2.spacing[2] }}>
            DELIVERY TIME
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <IconButton icon={CaretDown} accessibilityLabel="Earlier" variant="ghost" />
            <Text variant="display-sm">09:00 AM</Text>
            <IconButton icon={CaretUp} accessibilityLabel="Later" variant="ghost" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: v2.spacing[3] }}>
            <Globe size={16} color={v2.palette.text.tertiary} weight="duotone" />
            <Text variant="caption" color="tertiary">
              Timezone: America/Los_Angeles
            </Text>
          </View>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            leadingIcon={CheckCircle}
            style={{ marginTop: v2.spacing[3] }}
          >
            Save preferences
          </Button>
        </Card>
      ) : null}
    </ScreenScaffold>
  );
}

function PrivacyPreview({ v2 }) {
  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="Privacy" onBack={() => {}} />

      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginTop: 40,
          marginBottom: v2.spacing[3],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: v2.spacing[2],
        }}
      >
        <ShieldCheck size={20} color={v2.palette.success} weight="duotone" />
        <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
          Your data is encrypted in transit and at rest. We never sell or share your personal data.
        </Text>
      </Surface>

      <SettingsSection title="YOUR DATA">
        <SettingsRow leadingIcon={Export} title="Export your data" sublabel="Download a copy" showCaret />
        <SettingsRow
          leadingIcon={UserMinus}
          title="Blocked users"
          sublabel="Manage community blocks"
          showCaret
        />
      </SettingsSection>

      <SettingsSection title="LEGAL">
        <SettingsRow leadingIcon={Article} title="Privacy policy" showCaret />
        <SettingsRow leadingIcon={Article} title="Terms of service" showCaret />
      </SettingsSection>

      <SettingsSection title="DANGER ZONE">
        <SettingsRow
          leadingIcon={Trash}
          title="Delete account"
          sublabel="Permanently remove your account and data"
          destructive
          showCaret
        />
      </SettingsSection>
    </ScreenScaffold>
  );
}

function WearablePreview({ v2 }) {
  const [enabled, setEnabled] = useState(true);
  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="Health data" onBack={() => {}} />

      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginTop: 40,
          marginBottom: v2.spacing[2],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: v2.spacing[2],
        }}
      >
        <Warning size={20} color={v2.palette.warning} weight="duotone" />
        <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
          Coming soon — wearable integration requires a native build with health modules.
        </Text>
      </Surface>

      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginBottom: v2.spacing[3],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: v2.spacing[2],
        }}
      >
        <ShieldCheck size={20} color={v2.palette.success} weight="duotone" />
        <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
          Health data stays on your device and is never sent to our servers.
        </Text>
      </Surface>

      <SettingsSection>
        <SettingsRow
          leadingIcon={Heartbeat}
          title="Health data"
          sublabel={enabled ? 'Connected' : 'Not connected'}
          right={
            <SettingsSwitch
              value={enabled}
              onChange={setEnabled}
              accessibilityLabel="Health data"
            />
          }
        />
      </SettingsSection>

      {enabled ? (
        <Card padding={4} style={{ marginTop: v2.spacing[3] }}>
          <Text variant="h3" style={{ marginBottom: v2.spacing[3] }}>
            Data sources
          </Text>
          {[
            { Icon: Footprints, label: 'Steps', value: '8,432' },
            { Icon: Heart, label: 'Heart rate', value: '68 bpm' },
            { Icon: Moon, label: 'Sleep', value: '7.2h' },
          ].map((it, idx, arr) => (
            <View
              key={it.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 10,
                borderBottomWidth: idx === arr.length - 1 ? 0 : 1,
                borderBottomColor: v2.palette.border.subtle,
              }}
            >
              <it.Icon size={20} color={v2.palette.primary} weight="duotone" />
              <Text variant="body" style={{ flex: 1 }}>
                {it.label}
              </Text>
              <Text variant="body-sm" color="secondary">
                {it.value}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {enabled ? (
        <View style={{ marginTop: v2.spacing[3] }}>
          <Button variant="ghost" size="md" fullWidth leadingIcon={XCircle} haptic="warn">
            Disconnect
          </Button>
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

const FIXTURE_BLOCKS = [
  { blockedUserId: '1', reason: 'Repeated negative comments', blockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { blockedUserId: '2', reason: null, blockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { blockedUserId: '3', reason: 'Inappropriate content', blockedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
];

function BlockedPreview({ v2 }) {
  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="Blocked users" onBack={() => {}} />

      <Text
        variant="body-sm"
        color="secondary"
        style={{ marginTop: 40, marginBottom: v2.spacing[3] }}
      >
        Users you block won’t appear in community feeds. You can unblock any of them here.
      </Text>

      <View style={{ gap: v2.spacing[2] }}>
        {FIXTURE_BLOCKS.map((item) => (
          <Card key={item.blockedUserId} padding={4}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: v2.palette.bg.surfaceHigh,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserMinus size={18} color={v2.palette.primary} weight="duotone" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }}>
                  Anonymous user
                </Text>
                <Text variant="caption" color="secondary" style={{ marginTop: 2 }} numberOfLines={2}>
                  {item.reason || `Blocked ${new Date(item.blockedAt).toLocaleDateString()}`}
                </Text>
              </View>
              <Button variant="ghost" size="sm" haptic="firm">
                Unblock
              </Button>
            </View>
          </Card>
        ))}
      </View>
    </ScreenScaffold>
  );
}

const FIXTURE_FAQ = [
  {
    question: 'How do I create a journal entry?',
    answer:
      'Navigate to the Journal tab and select your mood, energy level, and emotions. Write your thoughts and tap Save.',
  },
  {
    question: 'What does the AI chat do?',
    answer:
      'The AI wellness assistant provides supportive conversations about your mental health and well-being.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Yes. All traffic is encrypted in transit using HTTPS, your password is stored as a salted BCrypt hash.',
  },
];

function HelpPreview({ v2 }) {
  const [expandedIdx, setExpandedIdx] = useState(0);
  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="Help & support" onBack={() => {}} />

      <Card padding={4} style={{ marginTop: 40, marginBottom: v2.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Lifebuoy size={22} color={v2.palette.primary} weight="duotone" />
          <Text variant="h3">Frequently asked questions</Text>
        </View>
        <View style={{ marginTop: v2.spacing[3] }}>
          {FIXTURE_FAQ.map((item, idx) => {
            const isOpen = expandedIdx === idx;
            const Caret = isOpen ? CaretUp : CaretDown;
            return (
              <Pressable
                key={item.question}
                accessibilityRole="button"
                accessibilityLabel={item.question}
                accessibilityState={{ expanded: isOpen }}
                onPress={() => setExpandedIdx(isOpen ? null : idx)}
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: idx === FIXTURE_FAQ.length - 1 ? 0 : 1,
                  borderBottomColor: v2.palette.border.subtle,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    variant="body"
                    style={{ fontFamily: 'DMSans_600SemiBold', flex: 1, marginRight: 8 }}
                  >
                    {item.question}
                  </Text>
                  <Caret size={18} color={v2.palette.text.tertiary} weight="duotone" />
                </View>
                {isOpen ? (
                  <Text
                    variant="body-sm"
                    color="secondary"
                    style={{ marginTop: 10, lineHeight: 21 }}
                  >
                    {item.answer}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card padding={4} style={{ marginBottom: v2.spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Envelope size={22} color={v2.palette.primary} weight="duotone" />
          <Text variant="h3">Contact support</Text>
        </View>
        <Text
          variant="body-sm"
          color="secondary"
          style={{ marginTop: 4, marginBottom: v2.spacing[3] }}
        >
          Having trouble or have a question not covered above?
        </Text>
        <Button variant="primary" size="lg" fullWidth leadingIcon={PaperPlaneTilt}>
          Email support
        </Button>
      </Card>

      <Card padding={4}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[2] }}>
          <Info size={22} color={v2.palette.primary} weight="duotone" />
          <Text variant="h3">About</Text>
        </View>
        <View style={{ marginTop: v2.spacing[3] }}>
          {[
            { label: 'App version', value: '1.0.0' },
            { label: 'Platform', value: 'Sakina Wellness' },
          ].map((row, idx, arr) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 12,
                borderBottomWidth: idx === arr.length - 1 ? 0 : 1,
                borderBottomColor: v2.palette.border.subtle,
              }}
            >
              <Text variant="body-sm" color="secondary">
                {row.label}
              </Text>
              <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </ScreenScaffold>
  );
}

const DATE_RANGE_OPTIONS = [
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' },
  { key: '180', label: 'Last 6 months' },
  { key: '365', label: 'Last year' },
];

function ExportPreview({ v2 }) {
  const [dateRange, setDateRange] = useState('90');
  const [includeAssessments, setIncludeAssessments] = useState(true);
  const [includeMoods, setIncludeMoods] = useState(true);
  const [includeJournals, setIncludeJournals] = useState(true);

  return (
    <ScreenScaffold ambient ambientIntensity="subtle" paddingBottom="tabBar">
      <ScreenHeader title="Export for therapist" onBack={() => {}} />

      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginTop: 40,
          marginBottom: v2.spacing[3],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: v2.spacing[2],
        }}
      >
        <ShieldCheck size={20} color={v2.palette.success} weight="duotone" />
        <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
          Generate a report to share with your therapist or healthcare provider. No raw journal text is included — only summaries and scores.
        </Text>
      </Surface>

      <Text variant="label" color="secondary" style={{ marginBottom: v2.spacing[2] }}>
        DATE RANGE
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: v2.spacing[2],
          marginBottom: v2.spacing[4],
        }}
      >
        {DATE_RANGE_OPTIONS.map((opt) => (
          <Chip key={opt.key} selected={dateRange === opt.key} onPress={() => setDateRange(opt.key)}>
            {opt.label}
          </Chip>
        ))}
      </View>

      <SettingsSection title="INCLUDE IN REPORT">
        <SettingsRow
          leadingIcon={ClipboardText}
          title="Assessment scores"
          sublabel="PHQ-9 and GAD-7 results"
          right={
            <SettingsSwitch
              value={includeAssessments}
              onChange={setIncludeAssessments}
              accessibilityLabel="Assessment scores"
            />
          }
        />
        <SettingsRow
          leadingIcon={Heart}
          title="Mood summary"
          sublabel="Mood counts and energy averages"
          right={
            <SettingsSwitch
              value={includeMoods}
              onChange={setIncludeMoods}
              accessibilityLabel="Mood summary"
            />
          }
        />
        <SettingsRow
          leadingIcon={Notebook}
          title="Journal summaries"
          sublabel="Date, mood, energy, word count"
          right={
            <SettingsSwitch
              value={includeJournals}
              onChange={setIncludeJournals}
              accessibilityLabel="Journal summaries"
            />
          }
        />
      </SettingsSection>

      <View style={{ gap: v2.spacing[2], marginTop: v2.spacing[4] }}>
        <Button variant="secondary" size="lg" fullWidth leadingIcon={Eye}>
          Preview data
        </Button>
        <Button variant="primary" size="lg" fullWidth leadingIcon={Download} haptic="firm">
          Export CSV report
        </Button>
      </View>
    </ScreenScaffold>
  );
}

export default SettingsPreviewScreen;
