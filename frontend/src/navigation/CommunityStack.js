import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommunityScreen, GroupFeedScreen } from '../screens/v2/community';

const Stack = createNativeStackNavigator();

export function CommunityStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationDuration: 350,
      }}
    >
      <Stack.Screen name="CommunityHome" component={CommunityScreen} />
      <Stack.Screen name="GroupFeed" component={GroupFeedScreen} />
    </Stack.Navigator>
  );
}
