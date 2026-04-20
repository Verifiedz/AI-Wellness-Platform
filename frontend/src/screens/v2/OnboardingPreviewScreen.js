/**
 * Wave D.2 verification — cycles through all 5 v2 onboarding screens with
 * stub navigation + OnboardingContext provider. Mounted at
 * /?onboardingpreview=1&screen=welcome on web.
 *
 * Available ?screen= values: welcome, goal, frequency, timeofday, firstvalue
 */

import React, { useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useV2Theme } from '../../theme/v2';
import { Text } from '../../ui/v2';
import {
  WelcomeScreen,
  GoalScreen,
  FrequencyScreen,
  TimeOfDayScreen,
  FirstValueScreen,
} from './onboarding';
import { useTheme } from '../../context/ThemeContext';
import { OnboardingProvider } from '../../context/OnboardingContext';

const SCREENS = {
  welcome: { Component: WelcomeScreen, label: 'Welcome' },
  goal: { Component: GoalScreen, label: 'Goal' },
  frequency: { Component: FrequencyScreen, label: 'Freq' },
  timeofday: { Component: TimeOfDayScreen, label: 'Time' },
  firstvalue: { Component: FirstValueScreen, label: 'Breath' },
};

function getInitial() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'welcome';
  const params = new URLSearchParams(window.location.search);
  const k = params.get('screen');
  return k && SCREENS[k] ? k : 'welcome';
}

const NAV_TARGET_TO_KEY = {
  Welcome: 'welcome',
  Goal: 'goal',
  Frequency: 'frequency',
  TimeOfDay: 'timeofday',
  FirstValue: 'firstvalue',
};

export function OnboardingPreviewScreen() {
  const v2 = useV2Theme();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [screen, setScreen] = useState(getInitial);

  const navigation = useMemo(
    () => ({
      navigate: (name) => {
        const k = NAV_TARGET_TO_KEY[name];
        if (k) setScreen(k);
      },
      goBack: () => setScreen('welcome'),
    }),
    []
  );
  const route = { params: { goals: ['stress'], checkInFrequency: 'daily', preferredTime: 'morning' } };
  const Current = SCREENS[screen].Component;

  return (
    <OnboardingProvider>
      <View style={{ flex: 1, backgroundColor: v2.palette.bg.base }}>
        <Current navigation={navigation} route={route} />

        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'center' }}
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 6,
              backgroundColor: v2.palette.bg.elevated,
              borderColor: v2.palette.border.subtle,
              borderWidth: 1,
              borderRadius: v2.radius.full,
              paddingHorizontal: 6,
              paddingVertical: 4,
            }}
          >
            {Object.entries(SCREENS).map(([key, { label }]) => {
              const active = key === screen;
              return (
                <Pressable
                  key={key}
                  onPress={() => setScreen(key)}
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
    </OnboardingProvider>
  );
}

export default OnboardingPreviewScreen;
