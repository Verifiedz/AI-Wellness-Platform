import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommunityScreen, GroupFeedScreen } from '../screens/v2/community';
import { useTheme } from '../context/ThemeContext';
import { CrisisButton } from '../components/CrisisButton';

const Stack = createNativeStackNavigator();

export function CommunityStack() {
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
      <Stack.Screen
        name="CommunityHome"
        component={CommunityScreen}
        options={{ title: 'Community' }}
      />
      <Stack.Screen
        name="GroupFeed"
        component={GroupFeedScreen}
        options={({ route }) => ({ title: route.params?.name || 'Group' })}
      />
    </Stack.Navigator>
  );
}
