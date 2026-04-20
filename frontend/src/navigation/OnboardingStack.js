import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  WelcomeScreen,
  GoalScreen,
  FrequencyScreen,
  TimeOfDayScreen,
  FirstValueScreen,
} from '../screens/v2/onboarding';

const Stack = createNativeStackNavigator();

export function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 350,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Goal" component={GoalScreen} />
      <Stack.Screen name="Frequency" component={FrequencyScreen} />
      <Stack.Screen name="TimeOfDay" component={TimeOfDayScreen} />
      <Stack.Screen name="FirstValue" component={FirstValueScreen} />
    </Stack.Navigator>
  );
}
