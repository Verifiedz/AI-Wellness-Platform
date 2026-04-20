import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BreathingExerciseScreen } from '../screens/v2/breathing';
import { useTheme } from '../context/ThemeContext';
import { CrisisButton } from '../components/CrisisButton';
import { AIChatScreen, ChatDrawerContent } from '../screens/v2/chat';

const Drawer = createDrawerNavigator();
const ChatNativeStack = createNativeStackNavigator();
const CHAT_ROUTE = 'AIChatConversation';

function ChatDrawerNav() {
  const { colors, fonts } = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { ...fonts.heading3, color: colors.text },
        headerRight: () => <CrisisButton />,
        drawerType: 'slide',
        swipeEdgeWidth: 40,
        swipeMinDistance: 50,
        drawerStyle: { backgroundColor: colors.background },
      }}
      drawerContent={(props) => <ChatDrawerContent {...props} />}
    >
      <Drawer.Screen name={CHAT_ROUTE} component={AIChatScreen} options={{ title: 'Sakina' }} />
    </Drawer.Navigator>
  );
}

export function ChatStack() {
  const { colors, fonts } = useTheme();

  return (
    <ChatNativeStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatNativeStack.Screen name="ChatDrawer" component={ChatDrawerNav} />
      <ChatNativeStack.Screen
        name="BreathingExercise"
        component={BreathingExerciseScreen}
        options={{
          headerShown: true,
          title: 'Breathe',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 350,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { ...fonts.heading3, color: colors.text },
          headerShadowVisible: false,
        }}
      />
    </ChatNativeStack.Navigator>
  );
}
