import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  SettingsScreen,
  NotificationSettingsScreen,
  ProfileSettingsScreen,
  PrivacySettingsScreen,
  BlockedUsersScreen,
  HelpSupportScreen,
  ExportScreen,
  WearableSettingsScreen,
} from '../screens/v2/settings';
import { ProfessionalDirectoryScreen } from '../screens/v2/community';

const Stack = createNativeStackNavigator();

export function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationDuration: 350,
      }}
    >
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="ExportData" component={ExportScreen} />
      <Stack.Screen name="WearableSettings" component={WearableSettingsScreen} />
      <Stack.Screen name="ProfessionalDirectory" component={ProfessionalDirectoryScreen} />
    </Stack.Navigator>
  );
}
