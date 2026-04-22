import React, { useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { House, NotePencil, UsersThree, ChatCircleDots, UserCircle } from 'phosphor-react-native';
import { HomeScreen } from '../screens/v2/home';
import { BreathingExerciseScreen } from '../screens/v2/breathing';
import {
  AssessmentScreen,
  AssessmentResultScreen,
  AssessmentHistoryScreen,
} from '../screens/v2/assessment';
import { JournalStack } from './JournalStack';
import { ChatStack } from './ChatStack';
import { SettingsStack } from './SettingsStack';
import { CommunityStack } from './CommunityStack';
import { TabBar } from '../ui/v2';
import { CrisisResourceModal } from '../components/CrisisResourceModal';

const Tab = createBottomTabNavigator();
const HomeStackNav = createNativeStackNavigator();

/**
 * Home tab uses a native stack nav for push transitions into Breathing /
 * Assessment. Each screen owns its own v2 ScreenHeader (HomeScreen included),
 * so the native RN header is hidden throughout.
 */
function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStackNav.Screen
        name="BreathingExercise"
        component={BreathingExerciseScreen}
        options={{ animation: 'slide_from_right', animationDuration: 350 }}
      />
      <HomeStackNav.Screen
        name="Assessment"
        component={AssessmentScreen}
        options={{ animation: 'slide_from_right', animationDuration: 350 }}
      />
      <HomeStackNav.Screen
        name="AssessmentResult"
        component={AssessmentResultScreen}
        options={{ animation: 'slide_from_right', animationDuration: 350 }}
      />
      <HomeStackNav.Screen
        name="AssessmentHistory"
        component={AssessmentHistoryScreen}
        options={{ animation: 'slide_from_right', animationDuration: 350 }}
      />
    </HomeStackNav.Navigator>
  );
}

export function MainTabs() {
  const [showCrisis, setShowCrisis] = useState(false);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('crisis:open', () => setShowCrisis(true));
    return () => sub.remove();
  }, []);

  return (
    <>
      <Tab.Navigator
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          // The custom glass TabBar handles keyboard auto-hide internally via
          // its scroll-aware animation. React Navigation also needs this flag
          // so the native bottom bar chrome doesn't intercept while composers
          // are up. The glass TabBar renders inside our safe-area container,
          // so it collapses cleanly when the keyboard opens.
          tabBarHideOnKeyboard: true,
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{ tabBarV2: { Icon: House, label: 'Home' } }}
        />
        <Tab.Screen
          name="Journal"
          component={JournalStack}
          options={{ tabBarV2: { Icon: NotePencil, label: 'Journal' } }}
        />
        <Tab.Screen
          name="Community"
          component={CommunityStack}
          options={{ tabBarV2: { Icon: UsersThree, label: 'Community' } }}
        />
        <Tab.Screen
          name="Sakina"
          component={ChatStack}
          options={{ tabBarV2: { Icon: ChatCircleDots, label: 'Sakina' } }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              // If the user is already on the Sakina tab, let the default
              // behavior run (no-op) so we don't force a new conversation.
              if (navigation.isFocused()) {
                return;
              }
              // Coming from a different tab — prevent default and force a
              // new conversation screen.
              e.preventDefault();
              navigation.navigate('Sakina', {
                screen: 'ChatDrawer',
                params: {
                  screen: 'AIChatConversation',
                  params: { sessionId: null, forceNewAt: Date.now() },
                },
              });
            },
          })}
        />
        <Tab.Screen
          name="Profile"
          component={SettingsStack}
          options={{ tabBarV2: { Icon: UserCircle, label: 'Profile' } }}
        />
      </Tab.Navigator>
      <CrisisResourceModal visible={showCrisis} onClose={() => setShowCrisis(false)} />
    </>
  );
}
