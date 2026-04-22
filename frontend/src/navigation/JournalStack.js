import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JournalScreen, MoodCalendarScreen } from '../screens/v2/journal';

const Stack = createNativeStackNavigator();

// Native header is hidden throughout — each screen renders its own v2
// ScreenHeader (scroll-reactive glass) so the futuristic aesthetic stays
// consistent and nothing double-stacks above it.
export function JournalStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationDuration: 350,
      }}
    >
      <Stack.Screen name="JournalHome" component={JournalScreen} />
      <Stack.Screen name="MoodCalendar" component={MoodCalendarScreen} />
    </Stack.Navigator>
  );
}
