import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Configure how notifications are presented when the app is in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions and obtain an Expo Push Token.
 *
 * Uses Expo's push notification service which works with Expo Go on both
 * iOS and Android without requiring direct Firebase/APNs configuration.
 *
 * @returns {Promise<string|null>} Expo push token (e.g. "ExponentPushToken[xxx]"),
 *   or null if permissions were denied or running on a simulator.
 */
export async function registerForPushNotificationsAsync() {
  // Push notifications require a physical device
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device.");
    return null;
  }

  // Check / request permissions
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Notification permissions not granted.");
    return null;
  }

  // Android: create a high-importance channel for daily tips
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("daily-tips", {
      name: "Daily Wellness Tips",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4A90D9",
    });
  }

  try {
    // Get the Expo project ID (set by `npx eas init`)
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.error(
        "Expo project ID not found. Run 'npx eas init' to configure your project."
      );
      return null;
    }

    // Expo Push Token — works with Expo Go on iOS & Android
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenResponse.data; // e.g. "ExponentPushToken[xxxx]"
  } catch (error) {
    console.error("Failed to get Expo push token:", error);
    return null;
  }
}

/**
 * Listen for notifications received while the app is in the foreground.
 * @returns {Subscription} – call `.remove()` to unsubscribe
 */
export function addNotificationReceivedListener(handler) {
  return Notifications.addNotificationReceivedListener(handler);
}

/**
 * Listen for the user tapping on a notification.
 * @returns {Subscription} – call `.remove()` to unsubscribe
 */
export function addNotificationResponseReceivedListener(handler) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Retrieve the last notification response (app cold-started from a tap).
 */
export function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}
