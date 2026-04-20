/**
 * Wave C verification — renders ScreenScaffold + ScreenHeader + TabBar with
 * sample bento content. Both themes screenshotted.
 *
 * Mounted at /?navshell=1 on web.
 *
 * Uses a stub navigator-shaped object so the TabBar renders without booting
 * the real React Navigation tree (which would require AuthContext etc.).
 */

import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import {
  House,
  ChatCircleDots,
  Notebook,
  UsersThree,
  GearSix,
  Plus,
  Sparkle,
  Wind,
  Heart,
  ArrowsClockwise,
} from 'phosphor-react-native';
import {
  ScreenScaffold,
  ScreenHeader,
  TabBar,
  Surface,
  Text,
  Card,
  Chip,
  Button,
  Avatar,
  IconButton,
  Blob,
  BreathingPulse,
  ProgressRing,
} from '../../ui/v2';
import { useV2Theme } from '../../theme/v2';
import { useTheme } from '../../context/ThemeContext';

const ROUTES = [
  { key: 'home',       name: 'Home',     Icon: House,           label: 'Home' },
  { key: 'chat',       name: 'Chat',     Icon: ChatCircleDots,  label: 'Sakina' },
  { key: 'journal',    name: 'Journal',  Icon: Notebook,        label: 'Journal' },
  { key: 'community',  name: 'Community',Icon: UsersThree,      label: 'Community' },
  { key: 'settings',   name: 'Settings', Icon: GearSix,         label: 'You' },
];

function makeStubNav(activeIndex, setActive) {
  const state = {
    index: activeIndex,
    routes: ROUTES.map((r) => ({ key: r.key, name: r.name })),
  };
  const navigation = {
    navigate: (name) => {
      const idx = ROUTES.findIndex((r) => r.name === name);
      if (idx >= 0) setActive(idx);
    },
    emit: () => ({ defaultPrevented: false }),
  };
  const descriptors = Object.fromEntries(
    ROUTES.map((r) => [
      r.key,
      {
        options: {
          tabBarV2: { Icon: r.Icon, label: r.label, accessibilityLabel: r.label },
        },
      },
    ])
  );
  return { state, navigation, descriptors };
}

export function NavShellPreviewScreen() {
  const v2 = useV2Theme();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [tab, setTab] = useState(0);
  const [mood, setMood] = useState('calm');

  const navProps = makeStubNav(tab, setTab);

  return (
    <ScreenScaffold
      ambient
      ambientIntensity="normal"
      paddingBottom="tabBar"
      bottomAccessory={<TabBar {...navProps} />}
    >
      <ScreenHeader
        title="Good morning"
        subtitle="Wednesday · 6:42 AM"
        right={
          <View style={{ flexDirection: 'row', gap: v2.spacing[1] }}>
            <Pressable
              onPress={toggleDarkMode}
              accessibilityRole="button"
              accessibilityLabel="Toggle theme"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: v2.radius.full,
                backgroundColor: v2.palette.bg.surface,
                borderWidth: 1,
                borderColor: v2.palette.border.subtle,
                alignSelf: 'center',
              }}
            >
              <Text variant="label">{isDarkMode ? 'DARK' : 'LIGHT'}</Text>
            </Pressable>
          </View>
        }
      />

      {/* Greeting hero card */}
      <Card padding={5} style={{ marginTop: v2.spacing[2] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <BreathingPulse>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: v2.palette.accent,
                opacity: 0.85,
              }}
            />
          </BreathingPulse>
          <View style={{ marginLeft: v2.spacing[4], flex: 1 }}>
            <Text variant="display-lg">Today is enough.</Text>
            <Text variant="body" color="secondary" style={{ marginTop: v2.spacing[1] }}>
              Take one mindful breath before you begin.
            </Text>
          </View>
        </View>
      </Card>

      {/* Bento row */}
      <View style={{ flexDirection: 'row', gap: v2.spacing[3], marginTop: v2.spacing[3] }}>
        <Card style={{ flex: 1 }} padding={4} onPress={() => {}} accessibilityLabel="Mood">
          <Text variant="label" color="tertiary">MOOD</Text>
          <View style={{ marginTop: v2.spacing[2], flexDirection: 'row', alignItems: 'center' }}>
            <Heart size={28} color={v2.palette.accent} weight="duotone" />
            <Text variant="h2" style={{ marginLeft: v2.spacing[2] }}>
              Calm
            </Text>
          </View>
          <Text variant="body-sm" color="secondary" style={{ marginTop: v2.spacing[1] }}>
            3 days in a row
          </Text>
        </Card>
        <Card style={{ flex: 1 }} padding={4} onPress={() => {}} accessibilityLabel="Streak">
          <Text variant="label" color="tertiary">STREAK</Text>
          <View
            style={{
              marginTop: v2.spacing[2],
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            <ProgressRing progress={0.78} size={56}>
              <View />
            </ProgressRing>
            <View style={{ marginLeft: v2.spacing[3] }}>
              <Text variant="h2">7</Text>
              <Text variant="body-sm" color="secondary">days</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Mood chips */}
      <View style={{ marginTop: v2.spacing[5] }}>
        <Text variant="label" color="secondary" style={{ marginBottom: v2.spacing[2] }}>
          HOW ARE YOU?
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: v2.spacing[2] }}>
          {['calm', 'focused', 'tender', 'tired', 'inspired'].map((m) => (
            <Chip
              key={m}
              selected={mood === m}
              onPress={() => setMood(m)}
              accessibilityLabel={`Set mood to ${m}`}
            >
              {m}
            </Chip>
          ))}
        </View>
      </View>

      {/* AI thinking indicator demo */}
      <Card variant="glass" padding={4} style={{ marginTop: v2.spacing[5] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar initials="SK" size="md" ring />
          <View style={{ marginLeft: v2.spacing[3], flex: 1 }}>
            <Text variant="h3">Sakina</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: v2.spacing[1] }}>
              <Blob size={20} />
              <Text variant="body-sm" color="secondary" style={{ marginLeft: v2.spacing[2] }}>
                gathering a thought…
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Quick actions */}
      <View
        style={{
          flexDirection: 'row',
          gap: v2.spacing[3],
          marginTop: v2.spacing[5],
        }}
      >
        <Button variant="primary" leadingIcon={Wind} fullWidth style={{ flex: 1 }}>
          Breathe
        </Button>
        <Button variant="secondary" leadingIcon={Plus} style={{ flex: 1 }} fullWidth>
          Reflect
        </Button>
      </View>

      {/* Footer surface */}
      <Surface elevation="high" padding={4} style={{ marginTop: v2.spacing[5] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[3] }}>
          <Sparkle size={24} color={v2.palette.primary} weight="duotone" />
          <View style={{ flex: 1 }}>
            <Text variant="h3">A small reminder</Text>
            <Text variant="body-sm" color="secondary" style={{ marginTop: v2.spacing[1] }}>
              You don’t have to feel a certain way to begin.
            </Text>
          </View>
          <IconButton icon={ArrowsClockwise} accessibilityLabel="Refresh" />
        </View>
      </Surface>
    </ScreenScaffold>
  );
}

export default NavShellPreviewScreen;
