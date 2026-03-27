import React, { useState } from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreen } from "../screens/HomeScreen";
import { JournalStack } from "./JournalStack";
import { ChatStack } from "./ChatStack";
import { SettingsStack } from "./SettingsStack";
import { useTheme } from "../context/ThemeContext";
import { CrisisButton } from "../components/CrisisButton";
import { CrisisResourceModal } from "../components/CrisisResourceModal";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: { focused: "home", default: "home-outline" },
  Journal: { focused: "journal", default: "journal-outline" },
  "AI Chat": { focused: "chatbubbles", default: "chatbubbles-outline" },
  Profile: { focused: "person-circle", default: "person-circle-outline" },
};

export function MainTabs() {
  const { colors, fonts } = useTheme();
  const [showCrisis, setShowCrisis] = useState(false);

  return (
    <View style={{ flex: 1 }}>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name] || {};
          const iconName = focused ? icons.focused : icons.default;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: "transparent",
          paddingBottom: 6,
          paddingTop: 6,
          height: 64,
          ...shadowTop,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.caption.fontFamily,
          fontSize: 11,
          fontWeight: "500",
        },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { ...fonts.heading3, color: colors.text },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Journal"
        component={JournalStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="AI Chat"
        component={ChatStack}
        options={{ headerShown: false }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate("AI Chat", {
              screen: "AIChatConversation",
              params: { sessionId: null, forceNewAt: Date.now() },
            });
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={SettingsStack}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
    <CrisisButton onPress={() => setShowCrisis(true)} />
    <CrisisResourceModal visible={showCrisis} onClose={() => setShowCrisis(false)} />
    </View>
  );
}

const shadowTop = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 8,
};
