import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { WelcomeScreen } from "../screens/onboarding/WelcomeScreen";
import { GoalScreen } from "../screens/onboarding/GoalScreen";
import { FrequencyScreen } from "../screens/onboarding/FrequencyScreen";
import { TimeOfDayScreen } from "../screens/onboarding/TimeOfDayScreen";
import { FirstValueScreen } from "../screens/onboarding/FirstValueScreen";

const Stack = createNativeStackNavigator();

export function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 350,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Goal" component={GoalScreen} />
      <Stack.Screen name="Frequency" component={FrequencyScreen} />
      <Stack.Screen name="TimeOfDay" component={TimeOfDayScreen} />
      <Stack.Screen name="FirstValue" component={FirstValueScreen} />
    </Stack.Navigator>
  );
}
