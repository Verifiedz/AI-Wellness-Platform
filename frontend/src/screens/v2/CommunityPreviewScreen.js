/**
 * Wave D.7 verification — composes community sub-components with fixtures.
 * Mounted at /?communitypreview=1&screen=hub|feed|professionals
 */

import React, { useState, useMemo } from 'react';
import { Platform, Pressable, View, TextInput } from 'react-native';
import { useV2Theme } from '../../theme/v2';
import { useTheme } from '../../context/ThemeContext';
import { ToastProvider } from '../../context/ToastContext';
import {
  Card,
  Chip,
  IconButton,
  ScreenHeader,
  ScreenScaffold,
  Surface,
  Text,
  Button,
} from '../../ui/v2';
import {
  ShieldCheck,
  PaperPlaneTilt,
  Phone,
  Globe,
  Buildings,
  MagnifyingGlass,
  Info,
} from 'phosphor-react-native';
import { getGroupIcon } from './community/groupIcons';
import { PostCard } from './community/PostCard';

const SCREENS = {
  hub: 'Hub',
  feed: 'Feed',
  professionals: 'Pros',
};

const FIXTURE_GROUPS = [
  { id: '1', slug: 'anxiety', name: 'Anxiety', description: 'Quiet support for anxious days.', icon: 'cloudy-outline', postCount: 24 },
  { id: '2', slug: 'sleep', name: 'Sleep', description: 'Rest is a practice.', icon: 'moon-outline', postCount: 13 },
  { id: '3', slug: 'mindfulness', name: 'Mindfulness', description: 'One breath at a time.', icon: 'leaf-outline', postCount: 41 },
  { id: '4', slug: 'students', name: 'Students', description: 'For the academic season.', icon: 'bulb-outline', postCount: 17 },
];

const FIXTURE_POSTS = [
  {
    id: 'p1',
    anonymousName: 'Sapphire Owl',
    content: 'The week ahead feels heavy. Trying to remind myself I only have to do today.',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    reactions: { heart: 12, hug: 6 },
    userReactions: ['heart'],
    replyCount: 3,
  },
  {
    id: 'p2',
    anonymousName: 'Sage Fox',
    content: 'Took my first walk outside in a few days. The light was kind.',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    reactions: { heart: 23, hug: 4, support: 8 },
    userReactions: [],
    replyCount: 1,
  },
];

const FIXTURE_PROFESSIONALS = [
  { id: '1', type: 'hotline', name: '988 Suicide & Crisis Lifeline', specialty: '24/7 free + confidential', description: 'Talk or text with a counsellor any time.', phone: '988', website: 'https://988lifeline.org' },
  { id: '2', type: 'platform', name: 'BetterHelp', specialty: 'Online therapy network', description: 'Match with licensed therapists for video, phone, or messaging sessions.', website: 'https://betterhelp.com' },
  { id: '3', type: 'organization', name: 'NAMI', specialty: 'Education + advocacy', description: 'National Alliance on Mental Illness offers local groups, education, and a HelpLine.', phone: '1-800-950-6264', website: 'https://nami.org' },
];

function getInitial() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'hub';
  const params = new URLSearchParams(window.location.search);
  return params.get('screen') || 'hub';
}

export function CommunityPreviewScreen() {
  const v2 = useV2Theme();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [screen, setScreen] = useState(getInitial);

  return (
    <ToastProvider>
      <View style={{ flex: 1, backgroundColor: v2.palette.bg.base }}>
        {screen === 'hub' ? <HubPreview v2={v2} /> : null}
        {screen === 'feed' ? <FeedPreview v2={v2} /> : null}
        {screen === 'professionals' ? <ProfessionalsPreview v2={v2} /> : null}

        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'center' }}
        >
          <View
            style={{
              flexDirection: 'row',
              gap: 6,
              backgroundColor: v2.palette.bg.elevated,
              borderColor: v2.palette.border.subtle,
              borderWidth: 1,
              borderRadius: v2.radius.full,
              paddingHorizontal: 6,
              paddingVertical: 4,
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
  return (
    <ScreenScaffold ambient ambientIntensity="subtle">
      <ScreenHeader title="Community" subtitle="Anonymous, supportive, kind" />
      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginTop: v2.spacing[2],
          marginBottom: v2.spacing[4],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: v2.spacing[2],
        }}
      >
        <ShieldCheck size={20} color={v2.palette.success} weight="duotone" />
        <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
          All posts are anonymous. Be kind. If you need immediate help, use the crisis button.
        </Text>
      </Surface>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: v2.spacing[3] }}>
        {FIXTURE_GROUPS.map((g) => {
          const Icon = getGroupIcon(g.icon);
          return (
            <View key={g.id} style={{ width: '48%' }}>
              <Card padding={4} onPress={() => {}} style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: v2.palette.bg.surfaceHigh,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={26} color={v2.palette.primary} weight="duotone" />
                </View>
                <Text variant="h3" align="center" style={{ marginTop: v2.spacing[3] }}>
                  {g.name}
                </Text>
                <Text variant="caption" color="tertiary" align="center" style={{ marginTop: 4 }}>
                  {g.description}
                </Text>
                <Text variant="caption" color="secondary" style={{ marginTop: v2.spacing[2] }}>
                  {g.postCount} posts
                </Text>
              </Card>
            </View>
          );
        })}
      </View>
    </ScreenScaffold>
  );
}

function FeedPreview({ v2 }) {
  const [text, setText] = useState('');
  return (
    <ScreenScaffold
      ambient
      ambientIntensity="subtle"
      paddingHorizontal={4}
      paddingTop={0}
      paddingBottom={0}
      scrollable={false}
    >
      <ScreenHeader title="Anxiety" onBack={() => {}} />
      <View style={{ flex: 1 }}>
        {FIXTURE_POSTS.map((p) => (
          <PostCard key={p.id} item={p} onMenu={() => {}} onReaction={() => {}} />
        ))}
      </View>
      <View
        style={{
          paddingTop: v2.spacing[3],
          paddingBottom: v2.spacing[3],
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: v2.spacing[2],
          borderTopWidth: 1,
          borderTopColor: v2.palette.border.subtle,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Share your thoughts…"
          placeholderTextColor={v2.palette.text.tertiary}
          multiline
          style={{
            flex: 1,
            minHeight: 48,
            borderWidth: 1,
            borderColor: v2.palette.border.subtle,
            backgroundColor: v2.palette.bg.surface,
            borderRadius: 22,
            paddingHorizontal: 18,
            paddingVertical: 12,
            fontFamily: 'DMSans_400Regular',
            fontSize: 15,
            color: v2.palette.text.primary,
          }}
        />
        <IconButton
          icon={PaperPlaneTilt}
          accessibilityLabel="Post"
          variant="accent"
          weight="fill"
          disabled={!text.trim()}
        />
      </View>
    </ScreenScaffold>
  );
}

function ProfessionalsPreview({ v2 }) {
  const [filter, setFilter] = useState('all');
  const filtered = useMemo(
    () => (filter === 'all' ? FIXTURE_PROFESSIONALS : FIXTURE_PROFESSIONALS.filter((p) => p.type === filter)),
    [filter]
  );
  return (
    <ScreenScaffold ambient ambientIntensity="subtle">
      <ScreenHeader title="Professional help" onBack={() => {}} />
      <Surface
        elevation="raised"
        padding={3}
        style={{
          marginTop: v2.spacing[2],
          marginBottom: v2.spacing[3],
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: v2.spacing[2],
        }}
      >
        <Info size={20} color={v2.palette.text.tertiary} weight="duotone" />
        <Text variant="body-sm" color="secondary" style={{ flex: 1 }}>
          These resources are not affiliated with Sakina. Listings are informational only.
        </Text>
      </Surface>
      <View style={{ flexDirection: 'row', gap: v2.spacing[2], marginBottom: v2.spacing[3] }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'hotline', label: 'Hotlines' },
          { key: 'platform', label: 'Online' },
          { key: 'organization', label: 'Orgs' },
        ].map((f) => (
          <Chip key={f.key} selected={filter === f.key} onPress={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </View>
      <View style={{ gap: v2.spacing[3] }}>
        {filtered.map((p) => {
          const Icon = p.type === 'hotline' ? Phone : p.type === 'organization' ? Buildings : p.type === 'platform' ? Globe : MagnifyingGlass;
          return (
            <Card key={p.id} padding={4}>
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
                  <Icon size={22} color={v2.palette.primary} weight="duotone" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="body" style={{ fontFamily: 'DMSans_600SemiBold' }} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text variant="caption" style={{ color: v2.palette.primary, marginTop: 2 }}>
                    {p.specialty}
                  </Text>
                </View>
              </View>
              <Text variant="body-sm" color="secondary" style={{ marginTop: v2.spacing[2], lineHeight: 20 }}>
                {p.description}
              </Text>
              <View style={{ flexDirection: 'row', gap: v2.spacing[2], marginTop: v2.spacing[3] }}>
                {p.phone ? (
                  <Button variant="secondary" size="sm" leadingIcon={Phone}>
                    Call
                  </Button>
                ) : null}
                {p.website ? (
                  <Button variant="ghost" size="sm" leadingIcon={Globe}>
                    Visit
                  </Button>
                ) : null}
              </View>
            </Card>
          );
        })}
      </View>
    </ScreenScaffold>
  );
}

export default CommunityPreviewScreen;
