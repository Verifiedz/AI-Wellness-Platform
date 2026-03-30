import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/SettingsScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';
import { PrivacySettingsScreen } from '../screens/PrivacySettingsScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { ExportScreen } from '../screens/ExportScreen';
import { WearableSettingsScreen } from '../screens/WearableSettingsScreen';
import { ProfessionalDirectoryScreen } from '../screens/ProfessionalDirectoryScreen';
import { useTheme } from '../context/ThemeContext';
import { CrisisButton } from '../components/CrisisButton';

const Stack = createNativeStackNavigator();

export function SettingsStack() {
  const { colors, fonts } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { ...fonts.heading3, color: colors.text },
        headerShadowVisible: false,
        headerRight: () => <CrisisButton />,
        animationDuration: 350,
      }}
    >
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Profile' }} />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="ProfileSettings"
        component={ProfileSettingsScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="PrivacySettings"
        component={PrivacySettingsScreen}
        options={{ title: 'Privacy' }}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ title: 'Help & Support' }}
      />
      <Stack.Screen
        name="ExportData"
        component={ExportScreen}
        options={{ title: 'Export for Therapist' }}
      />
      <Stack.Screen
        name="WearableSettings"
        component={WearableSettingsScreen}
        options={{ title: 'Health Data' }}
      />
      <Stack.Screen
        name="ProfessionalDirectory"
        component={ProfessionalDirectoryScreen}
        options={{ title: 'Find a Professional' }}
      />
    </Stack.Navigator>
  );
}
