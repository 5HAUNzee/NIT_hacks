import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.config";

const HomeDashboard = ({ navigation }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut, isLoaded: authLoaded } = useAuth();
  const [firebaseData, setFirebaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        if (user && db) {
          const userRef = doc(db, "users", user.id);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setFirebaseData(userSnap.data());
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await signOut();
            navigation.replace("Login");
          } catch (error) {
            Alert.alert("Error", "Failed to logout");
          }
        },
        style: "destructive",
      },
    ]);
  };

  if (!userLoaded || !authLoaded || loading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-20 pb-10">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-xs text-gray-600 mb-2 tracking-widest">
                DASHBOARD
              </Text>
              <Text className="text-5xl font-light text-white">
                {firebaseData?.firstName || "Hello"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              className="w-11 h-11 rounded-full bg-zinc-900 justify-center items-center border border-zinc-800"
            >
              <Feather name="log-out" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <View className="px-6 mb-12">
          <View className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
            {/* Avatar */}
            <View className="w-18 h-18 rounded-full bg-white justify-center items-center mb-6">
              <Text className="text-3xl font-semibold text-black">
                {firebaseData?.firstName?.charAt(0) || "U"}
                {firebaseData?.lastName?.charAt(0) || ""}
              </Text>
            </View>

            {/* Name */}
            <Text className="text-2xl font-normal text-white mb-1">
              {firebaseData?.firstName && firebaseData?.lastName
                ? `${firebaseData.firstName} ${firebaseData.lastName}`
                : "User"}
            </Text>

            {/* Email */}
            <Text className="text-sm text-gray-500 mb-1">
              {firebaseData?.email || user?.primaryEmailAddress?.emailAddress}
            </Text>

            {/* Username */}
            {firebaseData?.username && (
              <Text className="text-xs text-gray-600 mt-1">
                @{firebaseData.username}
              </Text>
            )}
          </View>
        </View>

        
        {/* Actions */}
        <View className="px-6 pb-20">
          <Text className="text-xs text-gray-600 mb-4 tracking-widest">
            QUICK ACTIONS
          </Text>

          {/* Edit Profile */}
          <TouchableOpacity className="flex-row justify-between items-center py-4.5 border-b border-zinc-800">
            <View className="flex-row items-center">
              <Feather name="edit-3" size={16} color="#fff" />
              <Text className="text-white ml-4 text-base font-normal">
                Edit Profile
              </Text>
            </View>
            <Feather name="arrow-right" size={16} color="#555" />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity className="flex-row justify-between items-center py-4.5 border-b border-zinc-800">
            <View className="flex-row items-center">
              <Feather name="bell" size={16} color="#fff" />
              <Text className="text-white ml-4 text-base font-normal">
                Notifications
              </Text>
            </View>
            <Feather name="arrow-right" size={16} color="#555" />
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity className="flex-row justify-between items-center py-4.5 border-b border-zinc-800">
            <View className="flex-row items-center">
              <Feather name="settings" size={16} color="#fff" />
              <Text className="text-white ml-4 text-base font-normal">
                Settings
              </Text>
            </View>
            <Feather name="arrow-right" size={16} color="#555" />
          </TouchableOpacity>

          {/* Help */}
          <TouchableOpacity className="flex-row justify-between items-center py-4.5 border-b border-zinc-800">
            <View className="flex-row items-center">
              <Feather name="help-circle" size={16} color="#fff" />
              <Text className="text-white ml-4 text-base font-normal">
                Help & Support
              </Text>
            </View>
            <Feather name="arrow-right" size={16} color="#555" />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row justify-between items-center py-4.5"
          >
            <View className="flex-row items-center">
              <Feather name="log-out" size={16} color="#ef4444" />
              <Text className="text-red-500 ml-4 text-base font-normal">
                Logout
              </Text>
            </View>
            <Feather name="arrow-right" size={16} color="#555" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeDashboard;
