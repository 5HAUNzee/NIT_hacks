import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";



export default function Start({ navigation }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          clearInterval(timer);
          setTimeout(() => {
            // Navigate to On1 screen
            navigation.replace("On1");
          }, 500);
          return 1;
        }
        return prev + 0.02;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [navigation]);

  const progressWidth = progress * 250;

  return (
    <View className="flex-1 bg-blue-900 items-center justify-center px-6">
      {/* Card */}
      <View className="bg-white/10 rounded-3xl p-8 mb-8 items-center">
        <MaterialCommunityIcons
          name="school"
          size={80}
          color="white"
          style={{ marginBottom: 16 }}
        />
        <Text className="text-4xl font-bold text-white mb-2">Inception</Text>
        <Text className="text-blue-200 text-lg">
         NIT_hacks Onboarding App
        </Text>
      </View>

      
        <Text className="text-blue-200 text-sm mt-3">
          Loading your experience...
        </Text>
      

      {/* Version */}
      <View className="absolute bottom-8">
        <Text className="text-blue-300 text-sm">Version 1.0.0</Text>
      </View>
    </View>
  );
}