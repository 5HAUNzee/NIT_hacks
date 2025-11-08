import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useUser } from "@clerk/clerk-expo";

const StudyCircles = ({ navigation }) => {
  const { user } = useUser();
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningCircle, setJoiningCircle] = useState(null);

  useEffect(() => {
    const circlesRef = collection(db, "studyCircles");
    const q = query(circlesRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const circlesList = [];
        querySnapshot.forEach((doc) => {
          circlesList.push({ id: doc.id, ...doc.data() });
        });
        setCircles(circlesList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching study circles:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleJoinCircle = async (circle) => {
    if (!user) return;

    if (circle.members?.includes(user.id)) {
      Alert.alert("Info", "You're already a member of this circle");
      return;
    }

    if (circle.memberCount >= circle.maxMembers) {
      Alert.alert("Circle Full", "This circle has reached maximum capacity");
      return;
    }

    setJoiningCircle(circle.id);
    try {
      const circleRef = doc(db, "studyCircles", circle.id);
      await updateDoc(circleRef, {
        members: arrayUnion(user.id),
        memberCount: (circle.memberCount || 0) + 1,
      });

      Alert.alert("Success", `You've joined ${circle.name}!`);
      // No need to manually refetch — listener updates circles automatically!
    } catch (error) {
      console.error("Error joining circle:", error);
      Alert.alert("Error", "Failed to join circle");
    } finally {
      setJoiningCircle(null);
    }
  };

  const myCircles = circles.filter((circle) =>
    circle.members?.includes(user?.id)
  );

  const browseCircles = circles.filter(
    (circle) =>
      !circle.members?.includes(user?.id) &&
      (circle.memberCount || 0) < circle.maxMembers
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-1">
            <Text className="text-2xl font-semibold text-gray-900">
              Study Circles
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Join study groups and learn together
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("CreateCircle")}
            className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text className="text-white font-medium ml-2">Create Circle</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Your Circles */}
        {myCircles.length > 0 && (
          <View className="px-6 py-6 border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              Your Circles
            </Text>
            {myCircles.map((circle) => (
              <View
                key={circle.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 mb-4"
              >
                {/* Circle Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="bg-blue-100 w-12 h-12 rounded-xl items-center justify-center">
                    <Text className="text-blue-700 font-bold text-lg">
                      {circle.subject?.substring(0, 2).toUpperCase() || "CS"}
                    </Text>
                  </View>
                </View>
                {/* Circle Info */}
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  {circle.name}
                </Text>
                <View className="flex-row items-center mb-2">
                  <Feather name="users" size={14} color="#6b7280" />
                  <Text className="text-sm text-gray-600 ml-2">
                    {circle.memberCount || 0} members
                  </Text>
                </View>
                {circle.meetingDay && circle.meetingTime && (
                  <View className="flex-row items-center mb-4">
                    <Feather name="clock" size={14} color="#6b7280" />
                    <Text className="text-sm text-gray-600 ml-2">
                      {circle.meetingDay}: {circle.meetingTime}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("CircleDetails", { circleId: circle.id })
                  }
                  className="bg-black py-3 rounded-xl"
                >
                  <Text className="text-white text-center font-semibold">
                    Open Circle
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Browse Study Circles */}
        <View className="px-6 py-6">
          <Text className="text-base font-semibold text-gray-900 mb-4">
            Browse Study Circles
          </Text>
          {browseCircles.length === 0 ? (
            <View className="bg-gray-50 rounded-2xl p-8 items-center">
              <Feather name="users" size={48} color="#d1d5db" />
              <Text className="text-gray-500 mt-4">No circles available</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("CreateCircle")}
                className="mt-4 bg-blue-600 px-6 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">Create First Circle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            browseCircles.map((circle) => (
              <View
                key={circle.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 mb-4"
              >
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="bg-gray-100 px-3 py-1 rounded-md">
                    <Text className="text-xs text-gray-700 font-medium">
                      {circle.subject?.substring(0, 10) || "General"}
                    </Text>
                  </View>
                </View>
                <Text className="text-base font-semibold text-gray-900 mb-2">
                  {circle.name}
                </Text>
                <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
                  {circle.description}
                </Text>
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Feather name="users" size={14} color="#6b7280" />
                    <Text className="text-sm text-gray-600 ml-2">
                      {circle.memberCount || 0} members
                    </Text>
                  </View>
                  {circle.meetingDay && circle.meetingTime && (
                    <View className="flex-row items-center">
                      <Feather name="clock" size={14} color="#6b7280" />
                      <Text className="text-sm text-gray-600 ml-2">
                        Next: {circle.meetingDay.substring(0, 3)}, {circle.meetingTime}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleJoinCircle(circle)}
                  disabled={joiningCircle === circle.id}
                  className="bg-white border border-gray-300 py-3 rounded-xl"
                >
                  {joiningCircle === circle.id ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                  ) : (
                    <Text className="text-gray-900 text-center font-semibold">
                      Join Circle
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StudyCircles;
