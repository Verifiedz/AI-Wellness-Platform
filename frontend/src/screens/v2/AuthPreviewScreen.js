/**
 * Wave D.1 verification — cycles through all 6 v2 auth screens with stub
 * navigation and route params. Mounted at /?authpreview=1&screen=login on web.
 *
 * Available ?screen= values: login, register, forgot, reset, verify, twofa
 */

import React, { useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useV2Theme } from '../../theme/v2';
import { Text } from '../../ui/v2';
import {
  LoginScreen,
  RegisterScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
  VerifyEmailScreen,
  TwoFactorScreen,
} from './auth';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';

// Stub auth context — no real AuthProvider runs in preview mode (it would
// pull in expo-secure-store / OnboardingContext / apiClient).
const STUB_AUTH = {
  user: null,
  token: null,
  isLoading: false,
  isLoggedIn: false,
  login: async () => {
    // Pretend the API echoed a 2FA challenge so we can preview that path too.
    return { requiresTwoFactor: true, email: 'preview@sakina.app', message: 'Preview' };
  },
  verifyTwoFactor: async () => {},
  logout: async () => {},
  register: async () => ({}),
};

const SCREENS = {
  login: { Component: LoginScreen, label: 'Login' },
  register: { Component: RegisterScreen, label: 'Register' },
  forgot: { Component: ForgotPasswordScreen, label: 'Forgot' },
  reset: { Component: ResetPasswordScreen, label: 'Reset' },
  verify: { Component: VerifyEmailScreen, label: 'Verify' },
  twofa: { Component: TwoFactorScreen, label: '2FA' },
};

function getInitialScreen() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'login';
  const params = new URLSearchParams(window.location.search);
  const k = params.get('screen');
  return k && SCREENS[k] ? k : 'login';
}

function buildStubNavigation(setScreen) {
  return {
    navigate: (name, params) => {
      // Map nav targets to preview keys when relevant.
      const map = {
        Login: 'login',
        Register: 'register',
        ForgotPassword: 'forgot',
        ResetPassword: 'reset',
        VerifyEmail: 'verify',
        TwoFactor: 'twofa',
      };
      const next = map[name];
      if (next) setScreen(next);
      // Allow inspecting nav params during dev:
      // eslint-disable-next-line no-console
      console.log('[stub navigate]', name, params);
    },
    goBack: () => setScreen('login'),
  };
}

function buildStubRoute(screen) {
  switch (screen) {
    case 'reset':
    case 'verify':
    case 'twofa':
      return { params: { email: 'preview@sakina.app', message: 'Check your inbox.', expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() } };
    default:
      return { params: {} };
  }
}

export function AuthPreviewScreen() {
  const v2 = useV2Theme();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [screen, setScreen] = useState(getInitialScreen);

  const navigation = useMemo(() => buildStubNavigation(setScreen), []);
  const route = useMemo(() => buildStubRoute(screen), [screen]);
  const Current = SCREENS[screen].Component;

  return (
    <AuthContext.Provider value={STUB_AUTH}>
      <View style={{ flex: 1, backgroundColor: v2.palette.bg.base }}>
        <Current navigation={navigation} route={route} />

        {/* Floating dev switcher */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          alignItems: 'center',
        }}
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
    </AuthContext.Provider>
  );
}

export default AuthPreviewScreen;
