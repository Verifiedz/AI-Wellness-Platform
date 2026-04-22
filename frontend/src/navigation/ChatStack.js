import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BreathingExerciseScreen } from '../screens/v2/breathing';
import { useTheme } from '../context/ThemeContext';
import { AIChatScreen, ChatDrawerContent } from '../screens/v2/chat';

const Drawer = createDrawerNavigator();
const ChatNativeStack = createNativeStackNavigator();
const CHAT_ROUTE = 'AIChatConversation';

// Drawer header is hidden — AIChatScreen renders its own glass ScreenHeader
// with a drawer-toggle button (left) and CrisisButton (right).
function ChatDrawerNav() {
  const { colors } = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
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
  return (
    <ChatNativeStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatNativeStack.Screen name="ChatDrawer" component={ChatDrawerNav} />
      <ChatNativeStack.Screen
        name="BreathingExercise"
        component={BreathingExerciseScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 350,
        }}
      />
    </ChatNativeStack.Navigator>
  );
}
