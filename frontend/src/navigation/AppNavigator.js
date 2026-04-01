import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOnboarding } from '../context/OnboardingContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { OnboardingStack } from './OnboardingStack';
import linking from './linkingConfig';

/**
 * Navigation ref – allows navigating from outside React components
 * (e.g. from the push-notification tap handler in App.js).
 */
export const navigationRef = React.createRef();

export function navigate(name, params) {
  navigationRef.current?.navigate(name, params);
}

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';

export function AppNavigator() {
  const { isLoggedIn, isLoading } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { hasSeenOnboarding, isOnboardingReady, initialAuthRoute } = useOnboarding();

  const [isNavStateReady, setIsNavStateReady] = useState(false);
  const [initialState, setInitialState] = useState();

  // Track previous login state so we can clear persisted state on logout.
  const prevIsLoggedInRef = useRef(isLoggedIn);

  useEffect(() => {
    const restoreState = async () => {
      try {
        // Only restore state for authenticated users who have completed onboarding.
        // If the user is not logged in or hasn't finished onboarding, skip restore
        // so they always land at the correct auth/onboarding screen.
        if (isLoggedIn && hasSeenOnboarding) {
          const savedState = await AsyncStorage.getItem(PERSISTENCE_KEY);
          if (savedState) {
            setInitialState(JSON.parse(savedState));
          }
        }
      } catch (e) {
        // Ignore restore errors — a missing or corrupt state is not fatal.
      } finally {
        setIsNavStateReady(true);
      }
    };

    // Only run once all prerequisite loading is finished.
    if (!isLoading && isOnboardingReady) {
      restoreState();
    }
  }, [isLoading, isOnboardingReady, isLoggedIn, hasSeenOnboarding]);

  // Clear persisted navigation state when the user logs out so the next
  // login session starts fresh at the default tab.
  useEffect(() => {
    if (prevIsLoggedInRef.current && !isLoggedIn) {
      AsyncStorage.removeItem(PERSISTENCE_KEY).catch(() => {});
      setInitialState(undefined);
    }
    prevIsLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  const navigationTheme = isDarkMode
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.accent,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.accent,
        },
      };

  // Show splash/loader while auth, onboarding, or nav-state restore is in progress.
  if (isLoading || !isOnboardingReady || !isNavStateReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const getNavigator = () => {
    if (!hasSeenOnboarding) return <OnboardingStack />;
    if (isLoggedIn) return <MainTabs />;
    return <AuthStack initialRoute={initialAuthRoute} />;
  };

  const handleStateChange = (state) => {
    // Only persist navigation state for authenticated users past onboarding.
    if (isLoggedIn && hasSeenOnboarding) {
      AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state)).catch(() => {});
    }
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      linking={linking}
      initialState={isLoggedIn && hasSeenOnboarding ? initialState : undefined}
      onStateChange={handleStateChange}
    >
      {getNavigator()}
    </NavigationContainer>
  );
}
