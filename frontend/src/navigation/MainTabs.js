import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreen } from "../screens/HomeScreen";
import { JournalScreen } from "../screens/JournalScreen";
import { AIChatScreen } from "../screens/AIChatScreen";
import { SettingsStack } from "./SettingsStack";
import { Colors } from "../theme/colors";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: { focused: "home", default: "home-outline" },
  Journal: { focused: "journal", default: "journal-outline" },
  "AI Chat": { focused: "chatbubbles", default: "chatbubbles-outline" },
  SettingsTab: { focused: "settings", default: "settings-outline" },
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name] || {};
          const iconName = focused ? icons.focused : icons.default;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="AI Chat" component={AIChatScreen} />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{ title: "Settings", headerShown: false }}
      />
    </Tab.Navigator>
  );
}
