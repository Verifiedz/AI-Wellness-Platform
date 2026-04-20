/**
 * Custom glass tab bar — replaces React Navigation's default bottom tabs.
 *
 * Features:
 *   - Floating: 16pt outer margin, glass background
 *   - Active indicator: aurora pill behind active icon with soft accent glow
 *   - Spring animation on tab change
 *   - Reduce-motion respected
 *   - Per-screen show/hide via React Navigation's screen options
 *
 * Drop-in replacement: <Tab.Navigator tabBar={(props) => <TabBar {...props} />} />
 *
 * Each route can declare an icon factory via screenOptions.tabBarIcon. We also
 * accept a v2-friendly { Icon: PhosphorComponent, label: string } payload via
 * screenOptions.tabBarV2.
 */

import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useV2Theme } from '../../../theme/v2';
import { useHaptic } from '../hooks/useHaptic';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { GlassPanel } from '../GlassPanel';
import { Text } from '../Text';
import { useScrollProgress } from './ScrollProgressContext';

const PILL_HEIGHT = 56;
const PILL_RADIUS = 28;
const TAB_MIN_WIDTH = 64;

/**
 * @typedef {Object} TabBarRouteOption
 * @property {React.ComponentType<{size:number,color:string,weight?:string}>} Icon  Phosphor component
 * @property {string} label
 * @property {string} [accessibilityLabel]
 */

/**
 * Standard React Navigation BottomTabBar props.
 * @param {{
 *   state: { index: number, routes: { key: string, name: string }[] },
 *   navigation: any,
 *   descriptors: Record<string, { options: any, route: any }>,
 *   onLayout?: (e: any) => void,
 * }} props
 */
export function TabBar({ state, navigation, descriptors, onLayout }) {
  const v2 = useV2Theme();
  const insets = useSafeAreaInsets();
  const fireHaptic = useHaptic();
  const reduced = useReducedMotion();
  const { scrollY } = useScrollProgress();

  const indicatorX = useSharedValue(state.index);

  // Tab bar shrinks slightly + lifts off the bottom edge as content scrolls under it.
  // 0–60px scroll range maps to a small but perceivable change.
  const shrinkStyle = useAnimatedStyle(() => {
    if (reduced) return {};
    const scale = interpolate(scrollY.value, [0, 60], [1, 0.94], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [0, 60], [0, -2], Extrapolation.CLAMP);
    return {
      transform: [{ translateY: withTiming(translateY, { duration: 120 }) }, { scale: withTiming(scale, { duration: 120 }) }],
    };
  });

  useEffect(() => {
    if (reduced) {
      indicatorX.value = state.index;
    } else {
      indicatorX.value = withSpring(state.index, v2.motion.spring.snap);
    }
  }, [state.index, indicatorX, reduced, v2.motion.spring.snap]);

  const tabCount = state.routes.length;

  const indicatorStyle = useAnimatedStyle(() => {
    const widthPct = 100 / tabCount;
    return {
      left: `${interpolate(indicatorX.value, [0, tabCount - 1], [0, (tabCount - 1) * widthPct])}%`,
      width: `${widthPct}%`,
    };
  });

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: v2.spacing[4],
        right: v2.spacing[4],
        bottom: Math.max(insets.bottom, v2.spacing[3]),
      }}
      onLayout={onLayout}
    >
      <Animated.View style={shrinkStyle}>
      <GlassPanel radius="full" border padding={1}>
        <View
          style={{
            flexDirection: 'row',
            height: PILL_HEIGHT,
            position: 'relative',
            alignItems: 'center',
          }}
        >
          {/* Active aurora pill */}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: 4,
                bottom: 4,
                paddingHorizontal: 8,
              },
              indicatorStyle,
            ]}
          >
            <View
              style={{
                flex: 1,
                marginHorizontal: 4,
                borderRadius: PILL_RADIUS,
                backgroundColor: v2.palette.primary,
                opacity: 0.18,
              }}
            />
          </Animated.View>

          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const opt = descriptors[route.key]?.options ?? {};
            const v2Opt = opt.tabBarV2 ?? {};
            const Icon = v2Opt.Icon ?? opt.tabBarIcon;
            const label = v2Opt.label ?? opt.title ?? route.name;
            const a11yLabel = v2Opt.accessibilityLabel ?? label;
            const color = focused ? v2.palette.primary : v2.palette.text.tertiary;

            const handle = () => {
              fireHaptic('tap');
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={handle}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={a11yLabel}
                style={{
                  flex: 1,
                  minWidth: TAB_MIN_WIDTH,
                  height: PILL_HEIGHT,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}
              >
                {Icon ? (
                  <Icon
                    size={focused ? 22 : 20}
                    color={color}
                    weight={focused ? 'fill' : 'duotone'}
                  />
                ) : (
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: color,
                    }}
                  />
                )}
                <Text
                  variant="label"
                  style={{
                    color,
                    marginTop: 4,
                    fontFamily: 'DMSans_600SemiBold',
                  }}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassPanel>
      </Animated.View>
    </View>
  );
}

export default TabBar;
