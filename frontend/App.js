import React, { useCallback, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { TipProvider, useTip } from './src/context/TipContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { OnboardingProvider } from './src/context/OnboardingContext';
import { AppNavigator, navigate } from './src/navigation/AppNavigator';
import { apiClient } from './src/services/api';
import { notificationApi } from './src/services/notificationApi';
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
} from './src/services/pushNotifications';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isLoggedIn, token, user } = useAuth();
  const { setTip } = useTip();
  const { isDarkMode, isThemeReady } = useTheme();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (token && user) {
      apiClient.setAuth(token, user.id);
    } else {
      apiClient.clearAuth();
    }
  }, [token, user]);

  useEffect(() => {
    if (!isLoggedIn) return;

    let mounted = true;

    (async () => {
      try {
        const deviceToken = await registerForPushNotificationsAsync();
        if (deviceToken && mounted) {
          await notificationApi.registerDevice(deviceToken);
        }
      } catch {
        // Push notification setup failed — non-critical
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const extractTip = (notification) => {
      const { title, body, data } = notification.request.content;
      return {
        title: title || 'Your Daily Wellness Tip',
        body: body || '',
        tipId: data?.tipId || null,
        category: data?.category || null,
      };
    };

    notificationListener.current = addNotificationReceivedListener((notification) => {
      setTip(extractTip(notification));
    });

    responseListener.current = addNotificationResponseReceivedListener((response) => {
      setTip(extractTip(response.notification));
      navigate('Home');
    });

    getLastNotificationResponse().then((response) => {
      if (response) {
        setTip(extractTip(response.notification));
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isLoggedIn, setTip]);

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <ThemeProvider>
        <OnboardingProvider>
          <AuthProvider>
            <TipProvider>
              <AppContent />
            </TipProvider>
          </AuthProvider>
        </OnboardingProvider>
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
