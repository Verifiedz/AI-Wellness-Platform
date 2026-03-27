import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { JournalScreen } from "../screens/JournalScreen";
import { MoodCalendarScreen } from "../screens/MoodCalendarScreen";
import { useTheme } from "../context/ThemeContext";
import { CrisisButton } from "../components/CrisisButton";

const Stack = createNativeStackNavigator();

export function JournalStack() {
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
        name="JournalHome"
        component={JournalScreen}
        options={{ title: "Journal" }}
      />
      <Stack.Screen
        name="MoodCalendar"
        component={MoodCalendarScreen}
        options={{ title: "Mood Calendar" }}
      />
    </Stack.Navigator>
  );
}
