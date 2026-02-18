import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { TipProvider, useTip } from "./src/context/TipContext";
import { AppNavigator, navigate } from "./src/navigation/AppNavigator";
import { apiClient } from "./src/services/api";
import { notificationApi } from "./src/services/notificationApi";
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
} from "./src/services/pushNotifications";

/**
 * Inner component that can access Auth and Tip contexts.
 *
 * Responsibilities:
 *  1. Keep the API client in sync with the current auth token.
 *  2. After login: request notification permissions, get device token,
 *     and register the token with the backend.
 *  3. Listen for incoming push notifications and pass daily-tip data
 *     to the TipContext so HomeScreen can display it.
 *  4. On notification tap: navigate to Home.
 */
function AppContent() {
  const { isLoggedIn, token, user } = useAuth();
  const { setTip } = useTip();
  const notificationListener = useRef();
  const responseListener = useRef();

  /* ---- sync API client auth ---- */
  useEffect(() => {
    if (token && user) {
      apiClient.setAuth(token, user.id);
    } else {
      apiClient.clearAuth();
    }
  }, [token, user]);

  /* ---- register device for push notifications ---- */
  useEffect(() => {
    if (!isLoggedIn) return;

    let mounted = true;

    (async () => {
      try {
        const deviceToken = await registerForPushNotificationsAsync();
        if (deviceToken && mounted) {
          console.log("Device push token:", deviceToken);
          const res = await notificationApi.registerDevice(deviceToken);
          if (res.error) {
            console.warn("register-device failed:", res.error);
          } else {
            console.log("Device registered with backend");
          }
        }
      } catch (err) {
        console.warn("Push notification setup error:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  /* ---- notification listeners ---- */
  useEffect(() => {
    if (!isLoggedIn) return;

    // Helper: extract tip data from a notification object
    const extractTip = (notification) => {
      const { title, body, data } = notification.request.content;
      return {
        title: title || "Your Daily Wellness Tip",
        body: body || "",
        tipId: data?.tipId || null,
        category: data?.category || null,
      };
    };

    // Foreground: show the tip immediately on Home
    notificationListener.current = addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received (foreground)");
        setTip(extractTip(notification));
      }
    );

    // Tap: set tip and navigate to Home
    responseListener.current = addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification tapped");
        setTip(extractTip(response.notification));
        navigate("Home");
      }
    );

    // Cold start: check if app was opened from a notification
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
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}

/**
 * Root component – wraps the app in Auth and Tip providers.
 */
export default function App() {
  return (
    <AuthProvider>
      <TipProvider>
        <AppContent />
      </TipProvider>
    </AuthProvider>
  );
}
