import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SettingsScreen } from "../screens/SettingsScreen";
import { NotificationSettingsScreen } from "../screens/NotificationSettingsScreen";
import { Colors } from "../theme/colors";

const Stack = createNativeStackNavigator();

export function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: "Notification Settings" }}
      />
    </Stack.Navigator>
  );
}
