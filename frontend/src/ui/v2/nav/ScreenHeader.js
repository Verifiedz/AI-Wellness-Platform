/**
 * ScreenHeader — futuristic top bar for Sakina.
 *
 * Aesthetic: Liquid Glass (iOS 26 inspired). The header is transparent at the
 * top of the scroll and morphs into a frosted-glass band as content scrolls
 * under it. A thin accent hairline glows at the bottom edge when the glass
 * state is active, tying it to the aurora palette. Left/right controls render
 * as glass IconButtons on a transparent surface.
 *
 * Layout contract (unchanged): [back?] [title + subtitle?] [right slot]
 * Heights stay 56pt minimum. Title is h2 by default, optionally serif.
 *
 * Scroll reactivity: reads the shared scrollY published by ScreenScaffold
 * (via ScrollProgressContext). Respects reduce-motion.
 */

import React from 'react';
import { Platform, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { CaretLeft } from 'phosphor-react-native';
import { useV2Theme } from '../../../theme/v2';
import { Text } from '../Text';
import { IconButton } from '../IconButton';
import { CrisisButton } from '../../../components/CrisisButton';
import { useScrollProgress } from './ScrollProgressContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useDeviceTier } from '../hooks/useDeviceTier';

/**
 * @param {{
 *   title?: string,
 *   subtitle?: string,
 *   serif?: boolean,
 *   onBack?: () => void,
 *   right?: React.ReactNode,
 *   left?: React.ReactNode,       // overrides default back
 *   align?: 'left'|'center',
 *   style?: any,
 *   glass?: boolean,              // default true — frosts on scroll
 *   pinnedGlass?: boolean,        // skip scroll morph, always frosted
 *   hideCrisis?: boolean,         // opt out of the auto-appended CrisisButton
 * }} props
 */
export function ScreenHeader({
  title,
  subtitle,
  serif = false,
  onBack,
  right,
  left,
  align = 'left',
  style,
  glass = true,
  pinnedGlass = false,
  hideCrisis = false,
}) {
  const v2 = useV2Theme();
  const { scrollY } = useScrollProgress();
  const reduced = useReducedMotion();
  const tier = useDeviceTier();

  let leftSlot = null;
  if (left !== undefined) {
    leftSlot = left;
  } else if (onBack) {
    leftSlot = (
      <IconButton
        icon={CaretLeft}
        accessibilityLabel="Go back"
        onPress={onBack}
        variant="ghost"
        weight="bold"
      />
    );
  } else if (align === 'center' && right) {
    leftSlot = <View style={{ width: 48, height: 48 }} />;
  }

  // Scroll morph: transparent → frosted glass band over 0..40px of scroll.
  // Reduced motion users get the frosted state immediately so the UI never
  // flashes contrast as they scroll.
  const morphStyle = useAnimatedStyle(() => {
    if (pinnedGlass || reduced || !glass) {
      return { opacity: pinnedGlass || !glass ? (pinnedGlass ? 1 : 0) : 1 };
    }
    const opacity = interpolate(scrollY.value, [0, 40], [0, 1], Extrapolation.CLAMP);
    return { opacity };
  });

  const hairlineStyle = useAnimatedStyle(() => {
    if (pinnedGlass) return { opacity: 0.9 };
    if (reduced || !glass) return { opacity: 0 };
    return {
      opacity: interpolate(scrollY.value, [8, 40], [0, 0.9], Extrapolation.CLAMP),
    };
  });

  const useBlur =
    glass && (Platform.OS === 'ios' || (Platform.OS === 'android' && tier !== 'low'));

  // Row layout — same as before. Title block flexes; left/right are fixed-sized.
  const row = (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 56,
          paddingVertical: v2.spacing[2],
          paddingHorizontal: glass ? v2.spacing[1] : 0,
          gap: v2.spacing[2],
        },
        style,
      ]}
    >
      {leftSlot}
      <View style={{ flex: 1, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
        {title ? (
          <Text variant={serif ? 'display-lg' : 'h2'} numberOfLines={1} align={align}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="body-sm" color="secondary" numberOfLines={1} align={align}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {/* Right slot: the screen's own right control(s) followed by the global
          CrisisButton. Keeping CrisisButton here (instead of in each stack's
          native headerRight) means every glass ScreenHeader in the app
          always surfaces the crisis affordance in a consistent spot. */}
      {right || !hideCrisis ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: v2.spacing[1] }}>
          {right ?? null}
          {hideCrisis ? null : <CrisisButton />}
        </View>
      ) : null}
    </View>
  );

  if (!glass) {
    // Legacy flat header for screens that opt out (e.g. modal sheets that
    // want the header to move with the content, not float).
    return row;
  }

  // Glass mode: render the row above an animated frosted-glass layer. The
  // glass fades in as the content scrolls underneath, so above-the-fold
  // content still bleeds through while the header stays readable once you
  // scroll into dense content.
  //
  // marginBottom reserves breathing room between the header (and its
  // scroll-hairline at bottom: 0) and the first content block below. Every
  // glass ScreenHeader in the app gets the same gap so screens read
  // consistently without each one re-specifying top spacing on their first
  // child.
  return (
    <View style={{ position: 'relative', marginBottom: v2.spacing[3] }}>
      {/* Animated frosted glass layer — absolutely positioned behind the row. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: -v2.spacing[2],
            left: -v2.spacing[4],
            right: -v2.spacing[4],
            bottom: 0,
          },
          morphStyle,
        ]}
      >
        {useBlur ? (
          <BlurView
            intensity={Platform.OS === 'ios' ? 60 : 40}
            tint={v2.palette.glassTint}
            experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
            style={{
              flex: 1,
              backgroundColor: v2.isDark
                ? 'rgba(11, 15, 26, 0.35)'
                : 'rgba(245, 244, 238, 0.55)',
            }}
          />
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: v2.isDark
                ? 'rgba(11, 15, 26, 0.85)'
                : 'rgba(245, 244, 238, 0.85)',
            }}
          />
        )}
      </Animated.View>

      {/* Bottom hairline — a soft accent-tinted rule that appears with the
          glass. Reads like a runway light under the header. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: -v2.spacing[4],
            right: -v2.spacing[4],
            height: 1,
            backgroundColor: withAlpha(v2.palette.primary, 0.45),
          },
          hairlineStyle,
        ]}
      />

      {row}
    </View>
  );
}

function withAlpha(color, alpha) {
  if (!color) return `rgba(0,0,0,${alpha})`;
  if (color.startsWith('rgba(')) return color;
  if (color.startsWith('#') && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}

export default ScreenHeader;
