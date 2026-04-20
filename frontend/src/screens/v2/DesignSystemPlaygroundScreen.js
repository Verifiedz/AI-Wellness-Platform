/**
 * Wave B verification playground — renders every v2 primitive in both themes.
 *
 * Mounted at /?playground=1 on web. Becomes the screenshot baseline for Wave B
 * and a living style guide as later waves consume the primitives.
 */

import React, { useRef, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import {
  Bell,
  Heart,
  Sparkle,
  ArrowRight,
  Microphone,
  Wind,
} from 'phosphor-react-native';
import {
  Text,
  Surface,
  Divider,
  AuroraBackground,
  GlassPanel,
  BreathingPulse,
  Blob,
  ProgressRing,
  ParticleBloom,
  Button,
  IconButton,
  Chip,
  Switch,
  Slider,
  Input,
  Card,
  Avatar,
  Toast,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../ui/v2';
import { useV2Theme } from '../../theme/v2';
import { useTheme } from '../../context/ThemeContext';

function Section({ title, children }) {
  const v2 = useV2Theme();
  return (
    <View style={{ marginTop: v2.spacing[8] }}>
      <Text
        variant="label"
        color="secondary"
        style={{ marginBottom: v2.spacing[3], paddingHorizontal: v2.spacing[4] }}
      >
        {title}
      </Text>
      <View style={{ paddingHorizontal: v2.spacing[4] }}>{children}</View>
    </View>
  );
}

function Row({ children, gap = 3 }) {
  const v2 = useV2Theme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: v2.spacing[gap] }}>
      {children}
    </View>
  );
}

export function DesignSystemPlaygroundScreen() {
  const v2 = useV2Theme();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const toastRef = useRef(null);
  const bloomRef = useRef(null);

  const [chipState, setChipState] = useState({ calm: true, focus: false, sleep: false });
  const [switchOn, setSwitchOn] = useState(true);
  const [sliderValue, setSliderValue] = useState(0.5);
  const [emailValue, setEmailValue] = useState('');
  const [bioValue, setBioValue] = useState('');
  const [errorEmail, setErrorEmail] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: v2.palette.bg.base }}>
      <AuroraBackground intensity="subtle" />

      <ScrollView
        contentContainerStyle={{
          paddingTop: v2.spacing[6],
          paddingBottom: v2.spacing[16],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: v2.spacing[4],
            marginBottom: v2.spacing[3],
          }}
        >
          <View>
            <Text variant="display-lg">Sakina v2</Text>
            <Text variant="body" color="secondary">
              Component playground — {isDarkMode ? 'Midnight Aurora' : 'Sage Mist'}
            </Text>
          </View>
          <Pressable
            onPress={toggleDarkMode}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: v2.radius.full,
              backgroundColor: v2.palette.bg.surface,
              borderWidth: 1,
              borderColor: v2.palette.border.subtle,
            }}
          >
            <Text variant="label">{isDarkMode ? 'DARK' : 'LIGHT'}</Text>
          </Pressable>
        </View>

        {/* Typography */}
        <Section title="Typography">
          <Surface padding={4}>
            <Text variant="display-lg" style={{ marginBottom: v2.spacing[2] }}>Today is enough.</Text>
            <Text variant="h1" style={{ marginBottom: v2.spacing[1] }}>Heading one</Text>
            <Text variant="h3" color="secondary" style={{ marginBottom: v2.spacing[3] }}>
              Heading three — secondary
            </Text>
            <Text variant="body">
              Body — quiet legibility. Designed for long reading without fatigue.
            </Text>
            <Text variant="body-sm" color="secondary" style={{ marginTop: v2.spacing[2] }}>
              Body small — secondary tint
            </Text>
            <Text variant="mono" color="tertiary" style={{ marginTop: v2.spacing[2] }}>
              06:42 AM · 4 BPM
            </Text>
          </Surface>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <Row>
            <Button variant="primary" leadingIcon={Sparkle}>Primary</Button>
            <Button variant="secondary" trailingIcon={ArrowRight}>Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </Row>
          <View style={{ height: v2.spacing[3] }} />
          <Row>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </Row>
        </Section>

        {/* Icon buttons */}
        <Section title="Icon buttons">
          <Row>
            <IconButton icon={Heart} accessibilityLabel="Favorite" variant="ghost" />
            <IconButton icon={Bell} accessibilityLabel="Notifications" variant="solid" />
            <IconButton icon={Microphone} accessibilityLabel="Voice" variant="accent" />
            <IconButton icon={Wind} accessibilityLabel="Breathe" variant="ghost" size="lg" />
          </Row>
        </Section>

        {/* Chips */}
        <Section title="Chips">
          <Row>
            <Chip
              selected={chipState.calm}
              onPress={() => setChipState((s) => ({ ...s, calm: !s.calm }))}
            >
              Calm
            </Chip>
            <Chip
              selected={chipState.focus}
              onPress={() => setChipState((s) => ({ ...s, focus: !s.focus }))}
              leadingIcon={Sparkle}
            >
              Focus
            </Chip>
            <Chip
              selected={chipState.sleep}
              onPress={() => setChipState((s) => ({ ...s, sleep: !s.sleep }))}
            >
              Sleep
            </Chip>
          </Row>
        </Section>

        {/* Switch + Slider */}
        <Section title="Switch + Slider">
          <Surface padding={4}>
            <Row gap={4}>
              <Switch value={switchOn} onChange={setSwitchOn} accessibilityLabel="Notifications" />
              <Text variant="body">Notifications</Text>
            </Row>
            <View style={{ height: v2.spacing[5] }} />
            <Slider value={sliderValue} onChange={setSliderValue} accessibilityLabel="Energy" />
            <Text variant="caption" color="tertiary" style={{ marginTop: v2.spacing[1] }}>
              Energy · {Math.round(sliderValue * 100)}%
            </Text>
          </Surface>
        </Section>

        {/* Inputs */}
        <Section title="Inputs">
          <Input
            label="Email"
            value={emailValue}
            onChangeText={setEmailValue}
            keyboardType="email-address"
          />
          <Input
            label="Email with error"
            value={errorEmail}
            onChangeText={setErrorEmail}
            error="That doesn't look like a valid email."
          />
          <Input
            label="Reflection"
            value={bioValue}
            onChangeText={setBioValue}
            multiline
            placeholder="What are you noticing?"
          />
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <Card onPress={() => {}} accessibilityLabel="Daily check-in">
            <Text variant="h3">Daily check-in</Text>
            <Text variant="body-sm" color="secondary" style={{ marginTop: 4 }}>
              How are you feeling this morning?
            </Text>
          </Card>
          <View style={{ height: v2.spacing[3] }} />
          <Card variant="glass" padding={4} onPress={() => {}} accessibilityLabel="Glass card">
            <Text variant="h3">Glass card</Text>
            <Text variant="body-sm" color="secondary" style={{ marginTop: 4 }}>
              Translucent — sits on top of aurora.
            </Text>
          </Card>
        </Section>

        {/* Surface elevations */}
        <Section title="Elevation (tonal)">
          {['flat', 'raised', 'high', 'elevated'].map((e) => (
            <Surface key={e} elevation={e} padding={4} style={{ marginBottom: v2.spacing[2] }}>
              <Text variant="h3">{e}</Text>
              <Text variant="body-sm" color="secondary">tonal surface + 1px border</Text>
            </Surface>
          ))}
        </Section>

        {/* Avatar */}
        <Section title="Avatar">
          <Row>
            <Avatar initials="SK" size="sm" />
            <Avatar initials="AB" size="md" />
            <Avatar initials="JN" size="lg" ring />
          </Row>
        </Section>

        {/* Animation primitives */}
        <Section title="Animation primitives">
          <Surface padding={4}>
            <Row gap={6}>
              <View style={{ alignItems: 'center' }}>
                <Blob size={56} />
                <Text variant="caption" color="tertiary" style={{ marginTop: 4 }}>Blob</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <BreathingPulse pace="normal">
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: v2.palette.primary,
                    }}
                  />
                </BreathingPulse>
                <Text variant="caption" color="tertiary" style={{ marginTop: 4 }}>Breath</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <ProgressRing progress={0.7} size={56} />
                <Text variant="caption" color="tertiary" style={{ marginTop: 4 }}>Progress</Text>
              </View>
            </Row>
          </Surface>
        </Section>

        {/* States */}
        <Section title="States">
          <Surface padding={2}>
            <LoadingState caption="Loading sessions" />
          </Surface>
          <View style={{ height: v2.spacing[3] }} />
          <Surface padding={2}>
            <EmptyState
              title="No reflections yet"
              body="Tap the plus to capture your first moment."
              action={{ label: 'Start journal', onPress: () => {} }}
            />
          </Surface>
          <View style={{ height: v2.spacing[3] }} />
          <Surface padding={2}>
            <ErrorState onRetry={() => {}} />
          </Surface>
        </Section>

        {/* Glass panel demo */}
        <Section title="GlassPanel">
          <View style={{ height: 120 }}>
            <GlassPanel padding={4} radius="2xl">
              <Text variant="h3">Glass over aurora</Text>
              <Text variant="body-sm" color="secondary">
                Backdrop blurred on iOS / Android (Dimezis), translucent fallback elsewhere.
              </Text>
            </GlassPanel>
          </View>
        </Section>

        {/* Divider */}
        <Section title="Divider">
          <View>
            <Text variant="body">Above</Text>
            <Divider style={{ marginVertical: v2.spacing[2] }} />
            <Text variant="body">Below</Text>
          </View>
        </Section>

        {/* Trigger surfaces */}
        <Section title="Trigger Toast / Bloom">
          <Row>
            <Button
              variant="secondary"
              onPress={() =>
                toastRef.current?.show({
                  kind: 'success',
                  title: 'Saved',
                  body: 'Your reflection is safe.',
                })
              }
            >
              Show toast
            </Button>
            <Button variant="ghost" onPress={() => bloomRef.current?.bloom({ x: 200, y: 400 })}>
              Bloom
            </Button>
          </Row>
        </Section>

        <View style={{ height: v2.spacing[10] }} />
      </ScrollView>

      <Toast ref={toastRef} />
      <ParticleBloom ref={bloomRef} />
    </View>
  );
}

export default DesignSystemPlaygroundScreen;
