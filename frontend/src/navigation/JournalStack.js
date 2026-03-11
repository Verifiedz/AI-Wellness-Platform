import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { JournalScreen } from "../screens/JournalScreen";
import { MoodCalendarScreen } from "../screens/MoodCalendarScreen";
import { Colors } from "../theme/colors";

const Stack = createNativeStackNavigator();

export function JournalStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
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
