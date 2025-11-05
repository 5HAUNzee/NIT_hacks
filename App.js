import React, { useEffect, useState } from "react";
import "./global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { ActivityIndicator, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Start from "./user_interfaces/onboarding/Start";
import On1 from "./user_interfaces/onboarding/On1";
import Login from "./user_interfaces/auth/Login";
import Homedashboard from "./user_interfaces/home/Homedashboard";
import SignUp from "./user_interfaces/auth/Signup";

WebBrowser.maybeCompleteAuthSession();

// ✅ CONFIGURE TOKEN CACHE
const tokenCache = {
  async getToken(key) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`✅ Token restored from cache: ${key}`);
      }
      return item;
    } catch (error) {
      console.error("Error reading token:", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },

  async saveToken(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
      console.log(`✅ Token saved: ${key}`);
    } catch (error) {
      console.error("Error saving token:", error);
    }
  },

  async removeToken(key) {
    try {
      await SecureStore.deleteItemAsync(key);
      console.log(`✅ Token removed: ${key}`);
    } catch (error) {
      console.error("Error removing token:", error);
    }
  },
};

const Stack = createNativeStackNavigator();

// ✅ NAVIGATION WITH AUTH CHECK
function RootNavigator() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(null);

  useEffect(() => {
    const checkFirstTime = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
        setShowOnboarding(hasSeenOnboarding === null);
      } catch (error) {
        console.error("Error checking onboarding:", error);
        setShowOnboarding(false);
      }
    };

    if (authLoaded && userLoaded) {
      checkFirstTime();
    }
  }, [authLoaded, userLoaded]);

  // ✅ SHOW LOADING WHILE CHECKING SESSION
  if (!authLoaded || !userLoaded || showOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0a" }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // ✅ IF USER IS LOGGED IN - SKIP ONBOARDING & AUTH
  if (isSignedIn && user) {
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="HomeDashboard"
      >
        <Stack.Screen name="HomeDashboard" component={Homedashboard} />
      </Stack.Navigator>
    );
  }

  // ✅ IF FIRST TIME - SHOW ONBOARDING
  if (showOnboarding) {
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Start"
      >
        <Stack.Screen name="Start" component={Start} />
        <Stack.Screen name="On1" component={On1} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
      </Stack.Navigator>
    );
  }

  // ✅ RETURNING USER - SHOW LOGIN/SIGNUP
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUp" component={SignUp} />
    </Stack.Navigator>
  );
}

// ✅ MAIN APP
export default function App() {
  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey="pk_test_dG9nZXRoZXItdXJjaGluLTI1LmNsZXJrLmFjY291bnRzLmRldiQ"
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}
