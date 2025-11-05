import React from "react";
import "./global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ClerkProvider } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";

import Start from "./user_interfaces/onboarding/Start";
import On1 from "./user_interfaces/onboarding/On1";
import Login from "./user_interfaces/auth/Login";
import Homedashboard from "./user_interfaces/home/Homedashboard";
import SignUp from "./user_interfaces/auth/Signup";

// ✅ Required for OAuth to complete
WebBrowser.maybeCompleteAuthSession();

// ✅ Token Storage
const tokenCache = {
  getToken: async (key) => await SecureStore.getItemAsync(key),
  saveToken: async (key, value) => await SecureStore.setItemAsync(key, value),
};

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey="pk_test_dG9nZXRoZXItdXJjaGluLTI1LmNsZXJrLmFjY291bnRzLmRldiQ"
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{ headerShown: false }}
              initialRouteName="Start"
            >
              <Stack.Screen name="Start" component={Start} />
              <Stack.Screen name="On1" component={On1} />
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="SignUp" component={SignUp} />
              <Stack.Screen name="HomeDashboard" component={Homedashboard} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}
