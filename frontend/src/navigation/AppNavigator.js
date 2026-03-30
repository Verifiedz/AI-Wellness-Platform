import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useOnboarding } from '../context/OnboardingContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { OnboardingStack } from './OnboardingStack';

/**
 * Navigation ref – allows navigating from outside React components
 * (e.g. from the push-notification tap handler in App.js).
 */
export const navigationRef = React.createRef();

export function navigate(name, params) {
  navigationRef.current?.navigate(name, params);
}

export function AppNavigator() {
  const { isLoggedIn, isLoading } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { hasSeenOnboarding, isOnboardingReady, initialAuthRoute } = useOnboarding();

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

  if (isLoading || !isOnboardingReady) {
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

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      {getNavigator()}
    </NavigationContainer>
  );
}
