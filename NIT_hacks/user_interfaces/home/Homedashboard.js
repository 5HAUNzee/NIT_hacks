import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
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

  // 🔹 Sentiment analyzer states
  const [userInput, setUserInput] = useState("");
  const [sentimentResult, setSentimentResult] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

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

  // 🔹 Sentiment analysis function
  const analyzeSentiment = async () => {
    if (!userInput.trim()) {
      Alert.alert("Please enter text to analyze");
      return;
    }

    try {
      setLoadingAnalysis(true);
      setSentimentResult(null);

      // ⚠️ Replace with your deployed backend or cloud function URL
      const response = await fetch("http://192.168.31.156:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userInput }),
      });

      const data = await response.json();
      setSentimentResult(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error analyzing sentiment");
    } finally {
      setLoadingAnalysis(false);
    }
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

        {/* AI Chat Highlight Card */}
        <View className="px-6 mb-12">
          <TouchableOpacity
            onPress={() => navigation.navigate("Chat")}
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 border border-blue-500 border-opacity-50"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs text-blue-200 mb-2 tracking-widest">
                  FEATURE
                </Text>
                <Text className="text-2xl font-semibold text-white mb-2">
                  Chat with AI
                </Text>
                <Text className="text-sm text-blue-100">
                  Ask Gemini anything
                </Text>
              </View>
              <View className="w-12 h-12 bg-white bg-opacity-20 rounded-full justify-center items-center">
                <Feather name="message-circle" size={24} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
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

          {/* Chat with AI */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Chat")}
            className="flex-row justify-between items-center py-4.5 border-b border-zinc-800"
          >
            <View className="flex-row items-center">
              <Feather name="zap" size={16} color="#3b82f6" />
              <Text className="text-white ml-4 text-base font-normal">
                Chat with AI
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

        {/* 🔹 Sentiment Analyzer Section */}
        <View className="px-6 pb-20">
          <Text className="text-xs text-gray-600 mb-4 tracking-widest">
            SENTIMENT ANALYZER
          </Text>

          <View className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
            <Text className="text-white mb-2">Enter text to analyze:</Text>

            <View
              style={{
                backgroundColor: "#18181b",
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <TextInput
                style={{ color: "white", fontSize: 16 }}
                placeholder="Type something..."
                placeholderTextColor="#555"
                multiline
                value={userInput}
                onChangeText={setUserInput}
              />
            </View>

            <TouchableOpacity
              onPress={analyzeSentiment}
              className="bg-blue-600 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-base">
                Analyze
              </Text>
            </TouchableOpacity>

            {loadingAnalysis && (
              <ActivityIndicator
                size="small"
                color="#3b82f6"
                style={{ marginTop: 10 }}
              />
            )}

            {sentimentResult && !loadingAnalysis && (
              <View style={{ marginTop: 16 }}>
                <Text className="text-gray-400">Result:</Text>
                <Text
                  className={`text-lg font-semibold ${
                    sentimentResult.overall === "positive"
                      ? "text-green-400"
                      : sentimentResult.overall === "negative"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {sentimentResult.overall.toUpperCase()} (
                  {sentimentResult.score})
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeDashboard;
