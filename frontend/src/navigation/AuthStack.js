import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LoginScreen,
  RegisterScreen,
  VerifyEmailScreen,
  TwoFactorScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
} from '../screens/v2/auth';

const Stack = createNativeStackNavigator();

export function AuthStack({ initialRoute = 'Login' }) {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animationDuration: 350 }}
      initialRouteName={initialRoute}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="TwoFactor"
        component={TwoFactorScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}
