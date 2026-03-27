import React, { useEffect, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreen } from "../screens/HomeScreen";
import { BreathingExerciseScreen } from "../screens/BreathingExerciseScreen";
import { AssessmentScreen } from "../screens/AssessmentScreen";
import { AssessmentResultScreen } from "../screens/AssessmentResultScreen";
import { AssessmentHistoryScreen } from "../screens/AssessmentHistoryScreen";
import { JournalStack } from "./JournalStack";
import { ChatStack } from "./ChatStack";
import { SettingsStack } from "./SettingsStack";
import { CommunityStack } from "./CommunityStack";
import { useTheme } from "../context/ThemeContext";
import { CrisisButton } from "../components/CrisisButton";
import { CrisisResourceModal } from "../components/CrisisResourceModal";

const Tab = createBottomTabNavigator();
const HomeStackNav = createNativeStackNavigator();

const TAB_ICONS = {
  Home: { focused: "home", default: "home-outline" },
  Journal: { focused: "journal", default: "journal-outline" },
  Community: { focused: "people", default: "people-outline" },
  Sakina: { focused: "chatbubbles", default: "chatbubbles-outline" },
  Profile: { focused: "person-circle", default: "person-circle-outline" },
};

function HomeStack() {
  const { colors, fonts } = useTheme();

  return (
    <HomeStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { ...fonts.heading3, color: colors.text },
        headerShadowVisible: false,
        headerRight: () => <CrisisButton />,
      }}
    >
      <HomeStackNav.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <HomeStackNav.Screen
        name="BreathingExercise"
        component={BreathingExerciseScreen}
        options={{ title: "Breathe", animation: "slide_from_right", animationDuration: 350 }}
      />
      <HomeStackNav.Screen
        name="Assessment"
        component={AssessmentScreen}
        options={{ title: "Assessment", animation: "slide_from_right", animationDuration: 350 }}
      />
      <HomeStackNav.Screen
        name="AssessmentResult"
        component={AssessmentResultScreen}
        options={{ title: "Results", animation: "slide_from_right", animationDuration: 350 }}
      />
      <HomeStackNav.Screen
        name="AssessmentHistory"
        component={AssessmentHistoryScreen}
        options={{ title: "Assessment History", animation: "slide_from_right", animationDuration: 350 }}
      />
    </HomeStackNav.Navigator>
  );
}

export function MainTabs() {
  const { colors, fonts } = useTheme();
  const [showCrisis, setShowCrisis] = useState(false);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("crisis:open", () =>
      setShowCrisis(true)
    );
    return () => sub.remove();
  }, []);

  return (
    <>
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
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Journal" component={JournalStack} />
        <Tab.Screen name="Community" component={CommunityStack} />
        <Tab.Screen
          name="Sakina"
          component={ChatStack}
          listeners={({ navigation }) => ({
            tabPress: () => {
              navigation.navigate("Sakina", {
                screen: "ChatDrawer",
                params: {
                  screen: "AIChatConversation",
                  params: { sessionId: null, forceNewAt: Date.now() },
                },
              });
            },
          })}
        />
        <Tab.Screen name="Profile" component={SettingsStack} />
      </Tab.Navigator>
      <CrisisResourceModal
        visible={showCrisis}
        onClose={() => setShowCrisis(false)}
      />
    </>
  );
}

const shadowTop = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 8,
};
