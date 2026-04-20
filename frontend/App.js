import React, { useCallback, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, UIManager, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { TipProvider, useTip } from './src/context/TipContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { OnboardingProvider } from './src/context/OnboardingContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { NetworkBanner } from './src/components/NetworkBanner';
import { ToastProvider } from './src/context/ToastContext';
import { Toast } from './src/components/Toast';
import { AppNavigator, navigate } from './src/navigation/AppNavigator';
import { ThemeProbeScreen } from './src/screens/v2/ThemeProbeScreen';
import { DesignSystemPlaygroundScreen } from './src/screens/v2/DesignSystemPlaygroundScreen';
import { NavShellPreviewScreen } from './src/screens/v2/NavShellPreviewScreen';
import { AuthPreviewScreen } from './src/screens/v2/AuthPreviewScreen';
import { OnboardingPreviewScreen } from './src/screens/v2/OnboardingPreviewScreen';
import { HomePreviewScreen } from './src/screens/v2/HomePreviewScreen';
import { ChatPreviewScreen } from './src/screens/v2/ChatPreviewScreen';
import { JournalPreviewScreen } from './src/screens/v2/JournalPreviewScreen';
import { BreathAssessPreviewScreen } from './src/screens/v2/BreathAssessPreviewScreen';
import { CommunityPreviewScreen } from './src/screens/v2/CommunityPreviewScreen';
import { SettingsPreviewScreen } from './src/screens/v2/SettingsPreviewScreen';
import { setupNavigationFeatureFlags, ScrollProgressProvider } from './src/ui/v2';

// One-time setup for Reanimated 4.2 shared element transitions and other nav flags.
setupNavigationFeatureFlags();
import { apiClient } from './src/services/api';
import { notificationApi } from './src/services/notificationApi';
import { initSentry, setSentryUser, clearSentryUser } from './src/services/sentry';

initSentry();
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
} from './src/services/pushNotifications';

// Enable LayoutAnimation on Android globally so theme transitions animate smoothly
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
      setSentryUser(user.id);
    } else {
      apiClient.clearAuth();
      clearSentryUser();
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

  // Dev-only design surfaces: append ?probe=1 or ?playground=1 to the web URL.
  const search =
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.location?.search ?? '' : '';
  const isProbeMode = search.includes('probe=1');
  const isPlaygroundMode = search.includes('playground=1');

  let body;
  if (isPlaygroundMode) {
    body = <DesignSystemPlaygroundScreen />;
  } else if (isProbeMode) {
    body = <ThemeProbeScreen />;
  } else {
    body = <AppNavigator />;
  }

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {body}
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSerifDisplay_400Regular,
    JetBrainsMono_400Regular,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  // Dev-only short circuit: render the v2 design surfaces with only ThemeProvider
  // mounted, skipping AuthContext / NetworkBanner / push notifications. Avoids
  // expo-secure-store-on-web and other native-only init paths blowing up the page.
  const search =
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.location?.search ?? '' : '';
  const isDevSurface =
    search.includes('probe=1') ||
    search.includes('playground=1') ||
    search.includes('navshell=1') ||
    search.includes('authpreview=1') ||
    search.includes('onboardingpreview=1') ||
    search.includes('homepreview=1') ||
    search.includes('chatpreview=1') ||
    search.includes('journalpreview=1') ||
    search.includes('breathassesspreview=1') ||
    search.includes('communitypreview=1') ||
    search.includes('settingspreview=1');
  if (isDevSurface) {
    let DevSurface;
    if (search.includes('playground=1')) DevSurface = DesignSystemPlaygroundScreen;
    else if (search.includes('navshell=1')) DevSurface = NavShellPreviewScreen;
    else if (search.includes('authpreview=1')) DevSurface = AuthPreviewScreen;
    else if (search.includes('onboardingpreview=1')) DevSurface = OnboardingPreviewScreen;
    else if (search.includes('homepreview=1')) DevSurface = HomePreviewScreen;
    else if (search.includes('chatpreview=1')) DevSurface = ChatPreviewScreen;
    else if (search.includes('journalpreview=1')) DevSurface = JournalPreviewScreen;
    else if (search.includes('breathassesspreview=1')) DevSurface = BreathAssessPreviewScreen;
    else if (search.includes('communitypreview=1')) DevSurface = CommunityPreviewScreen;
    else if (search.includes('settingspreview=1')) DevSurface = SettingsPreviewScreen;
    else DevSurface = ThemeProbeScreen;
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <BottomSheetModalProvider>
            <View style={styles.root} onLayout={onLayoutRootView}>
              <ThemeProvider>
                <ScrollProgressProvider>
                  <DevSurface />
                </ScrollProgressProvider>
              </ThemeProvider>
            </View>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <KeyboardProvider>
          <BottomSheetModalProvider>
            <View style={styles.root} onLayout={onLayoutRootView}>
              <ThemeProvider>
                <ScrollProgressProvider>
                  <NetworkProvider>
                    <ToastProvider>
                      <OnboardingProvider>
                        <AuthProvider>
                          <TipProvider>
                            <NetworkBanner />
                            <AppContent />
                          </TipProvider>
                        </AuthProvider>
                      </OnboardingProvider>
                      <Toast />
                    </ToastProvider>
                  </NetworkProvider>
                </ScrollProgressProvider>
              </ThemeProvider>
            </View>
          </BottomSheetModalProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
