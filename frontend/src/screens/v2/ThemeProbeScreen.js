/**
 * Dev-only screen that renders every v2 design token visually.
 * Used as a screenshot baseline for Wave A verification and as a living style guide
 * across all later waves.
 *
 * Mounted only when EXPO_PUBLIC_DEV_MODE === 'true'.
 */

import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useV2Theme } from '../../theme/v2';
import { useTheme } from '../../context/ThemeContext';

const SWATCH_SIZE = 56;

function PaletteRow({ label, value, palette }) {
  return (
    <View style={styles.swatchRow}>
      <View
        style={[
          styles.swatch,
          {
            backgroundColor: value,
            borderColor: palette.border.subtle,
          },
        ]}
      />
      <View style={styles.swatchMeta}>
        <Text
          style={{
            color: palette.text.primary,
            fontSize: 13,
            fontFamily: 'DMSans_500Medium',
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: palette.text.tertiary,
            fontSize: 11,
            fontFamily: 'JetBrainsMono_400Regular',
          }}
        >
          {String(value)}
        </Text>
      </View>
    </View>
  );
}

function flattenPalette(palette) {
  const rows = [];
  for (const [key, val] of Object.entries(palette)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      for (const [k2, v2] of Object.entries(val)) {
        rows.push({ label: `${key}.${k2}`, value: v2 });
      }
    } else {
      rows.push({ label: key, value: val });
    }
  }
  return rows;
}

const TYPE_VARIANTS = [
  'display-xl',
  'display-lg',
  'h1',
  'h2',
  'h3',
  'body-lg',
  'body',
  'body-sm',
  'caption',
  'label',
  'mono',
];

const SPACING_KEYS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20];
const RADIUS_KEYS = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'];
const ELEVATION_KEYS = ['flat', 'raised', 'high', 'elevated'];

export function ThemeProbeScreen() {
  const v2 = useV2Theme();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { palette, spacing, radius, type, motion, elevation } = v2;
  const paletteRows = flattenPalette(palette);

  return (
    <View style={[styles.root, { backgroundColor: palette.bg.base }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing[4],
          paddingTop: spacing[6],
          paddingBottom: spacing[16],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[type('display-lg'), { color: palette.text.primary }]}>
              Sakina v2
            </Text>
            <Text style={[type('body'), { color: palette.text.secondary }]}>
              {isDarkMode ? 'Midnight Aurora' : 'Sage Mist'} — design token probe
            </Text>
          </View>
          <Pressable
            onPress={toggleDarkMode}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
            style={[
              styles.themeToggle,
              {
                backgroundColor: palette.bg.surface,
                borderColor: palette.border.subtle,
                borderRadius: radius.full,
              },
            ]}
          >
            <Text style={[type('label'), { color: palette.text.primary }]}>
              {isDarkMode ? 'DARK' : 'LIGHT'}
            </Text>
          </Pressable>
        </View>

        {/* Palette */}
        <Section title="Palette" palette={palette} type={type} spacing={spacing}>
          {paletteRows
            .filter((r) => typeof r.value === 'string' && r.value.startsWith('#'))
            .map((r) => (
              <PaletteRow key={r.label} label={r.label} value={r.value} palette={palette} />
            ))}
        </Section>

        {/* Typography */}
        <Section title="Typography" palette={palette} type={type} spacing={spacing}>
          {TYPE_VARIANTS.map((v) => (
            <View key={v} style={{ marginBottom: spacing[3] }}>
              <Text
                style={[
                  type('caption'),
                  { color: palette.text.tertiary, marginBottom: spacing[1] },
                ]}
              >
                {v}
              </Text>
              <Text style={[type(v), { color: palette.text.primary }]}>
                The quick brown fox
              </Text>
            </View>
          ))}
        </Section>

        {/* Spacing */}
        <Section title="Spacing (4pt grid)" palette={palette} type={type} spacing={spacing}>
          {SPACING_KEYS.map((k) => (
            <View key={k} style={styles.spacingRow}>
              <View
                style={{
                  width: spacing[k],
                  height: 16,
                  backgroundColor: palette.primary,
                  borderRadius: 2,
                }}
              />
              <Text
                style={[
                  type('mono'),
                  { color: palette.text.secondary, marginLeft: spacing[3] },
                ]}
              >
                {k} → {spacing[k]}px
              </Text>
            </View>
          ))}
        </Section>

        {/* Radius */}
        <Section title="Radius" palette={palette} type={type} spacing={spacing}>
          <View style={styles.radiusRow}>
            {RADIUS_KEYS.map((k) => (
              <View key={k} style={{ alignItems: 'center', marginRight: spacing[3] }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    backgroundColor: palette.bg.surface,
                    borderColor: palette.border.strong,
                    borderWidth: 1,
                    borderRadius: radius[k] === 9999 ? 28 : radius[k],
                  }}
                />
                <Text
                  style={[
                    type('caption'),
                    { color: palette.text.tertiary, marginTop: spacing[1] },
                  ]}
                >
                  {k}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Elevation */}
        <Section title="Elevation (tonal)" palette={palette} type={type} spacing={spacing}>
          {ELEVATION_KEYS.map((k) => (
            <View
              key={k}
              style={[
                elevation[k],
                {
                  padding: spacing[4],
                  borderRadius: radius.lg,
                  marginBottom: spacing[3],
                },
              ]}
            >
              <Text style={[type('h3'), { color: palette.text.primary }]}>{k}</Text>
              <Text style={[type('body-sm'), { color: palette.text.secondary }]}>
                bg + 1px tonal border
              </Text>
            </View>
          ))}
        </Section>

        {/* Motion */}
        <Section title="Motion durations (ms)" palette={palette} type={type} spacing={spacing}>
          {Object.entries(motion.duration).map(([k, v]) => (
            <View key={k} style={styles.motionRow}>
              <Text style={[type('body'), { color: palette.text.primary }]}>{k}</Text>
              <Text style={[type('mono'), { color: palette.text.secondary }]}>{v}</Text>
            </View>
          ))}
        </Section>

        <Section title="Haptic intents" palette={palette} type={type} spacing={spacing}>
          {Object.entries(motion.haptic).map(([k, v]) => (
            <View key={k} style={styles.motionRow}>
              <Text style={[type('body'), { color: palette.text.primary }]}>{k}</Text>
              <Text style={[type('mono'), { color: palette.text.tertiary }]}>{v}</Text>
            </View>
          ))}
        </Section>

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </View>
  );
}

function Section({ title, palette, type, spacing, children }) {
  return (
    <View style={{ marginTop: spacing[6] }}>
      <Text
        style={[
          type('label'),
          {
            color: palette.text.secondary,
            marginBottom: spacing[3],
          },
        ]}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeToggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
  },
  swatchMeta: { flex: 1 },
  spacingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  radiusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  motionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
});

export default ThemeProbeScreen;
