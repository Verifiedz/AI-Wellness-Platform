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

import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, View } from 'react-native';
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
import { Text } from '../Text';
import { useScrollProgress } from './ScrollProgressContext';

const BAR_HEIGHT = 64;
const PILL_RADIUS = 20;
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

  // React Navigation's `tabBarHideOnKeyboard` option is only honored by the
  // built-in tab bar. Since MainTabs replaces the default with this custom
  // component, the flag is a no-op — meaning the bar stays mounted below the
  // screen while the keyboard is up, reserving ~98px (64 content +
  // insets.bottom) of layout space. Any sticky composer above the keyboard
  // then renders that 98px above the keyboard top, producing a gap. Listen
  // for keyboard events directly and unmount the bar while the keyboard is
  // visible so sticky composers can land flush on the keyboard top.
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  // Unmount entirely while the keyboard is up — returning null drops the bar
  // out of the layout tree so any sticky composer above the keyboard lands
  // flush on the keyboard top with no reserved bottom space.
  if (keyboardVisible) return null;

  return (
    <View
      style={{
        backgroundColor: v2.palette.bg.surface,
        borderTopWidth: 1,
        borderTopColor: v2.palette.border.subtle,
        paddingBottom: insets.bottom,
      }}
      onLayout={onLayout}
    >
      <Animated.View style={shrinkStyle}>
        <View
          style={{
            flexDirection: 'row',
            height: BAR_HEIGHT,
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
                top: 6,
                bottom: 6,
                paddingHorizontal: 6,
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
                opacity: 0.16,
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
                  height: BAR_HEIGHT,
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
      </Animated.View>
    </View>
  );
}

export default TabBar;
