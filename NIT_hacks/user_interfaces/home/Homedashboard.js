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
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import ProfileSetupModal from "./ProfileSetupModal";

const HomeDashboard = ({ navigation }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut, isLoaded: authLoaded } = useAuth();
  const [firebaseData, setFirebaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        if (user && db) {
          const userRef = doc(db, "users", user.id);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setFirebaseData(data);

            if (!data.profileCompleted) {
              setShowProfileSetup(true);
            }
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

  // Fetch ALL projects
  React.useEffect(() => {
    const fetchAllProjects = async () => {
      try {
        const projectsRef = collection(db, "projects");
        const q = query(projectsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const projectsList = [];
        querySnapshot.forEach((doc) => {
          projectsList.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setAllProjects(projectsList);
        console.log(`✅ Fetched ${projectsList.length} projects from Firebase`);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setProjectsLoading(false);
      }
    };

    if (db) {
      fetchAllProjects();
    }
  }, []);

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

  const handleProfileComplete = async () => {
    setShowProfileSetup(false);
    try {
      const userRef = doc(db, "users", user.id);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setFirebaseData(userSnap.data());
      }
    } catch (error) {
      console.error("Error reloading user data:", error);
    }
  };

  if (!userLoaded || !authLoaded || loading) {
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
      <ProfileSetupModal
        visible={showProfileSetup}
        onComplete={handleProfileComplete}
      />

      {/* Header with Profile, Notification */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-4 border-b border-gray-100">
        <TouchableOpacity>
          <Feather name="menu" size={24} color="#1f2937" />
        </TouchableOpacity>

        <View className="flex-row items-center gap-4">
          <TouchableOpacity className="relative">
            <Feather name="bell" size={24} color="#1f2937" />
            <View className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </TouchableOpacity>

          {/* Profile Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center"
          >
            <Text className="text-blue-700 font-bold text-sm">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* All Projects Section */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold text-gray-900">
              Projects ({allProjects.length})
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Projects")}
              className="flex-row items-center"
            >
              <Text className="text-blue-600 font-medium mr-1">View All</Text>
              <Feather name="arrow-right" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {projectsLoading ? (
            <View className="bg-gray-50 rounded-2xl p-6 items-center justify-center h-48">
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text className="text-gray-500 mt-2">Loading projects...</Text>
            </View>
          ) : allProjects.length === 0 ? (
            <View className="bg-gray-50 rounded-2xl p-6 items-center">
              <Feather name="folder" size={48} color="#d1d5db" />
              <Text className="text-gray-500 mt-4">No projects yet</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("CreateProject")}
                className="mt-4 bg-blue-600 px-6 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">
                  Create First Project
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {allProjects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    onPress={() =>
                      navigation.navigate("ProjectDetails", {
                        projectId: project.id,
                      })
                    }
                    className="w-80 bg-gray-50 rounded-2xl overflow-hidden"
                  >
                    {/* Gradient Header */}
                    <View className="w-full h-32 bg-gradient-to-br from-blue-100 to-blue-200 items-center justify-center">
                      <Feather name="folder" size={40} color="#3b82f6" />
                    </View>

                    <View className="p-4">
                      <Text
                        className="text-sm text-gray-500 mb-1"
                        numberOfLines={1}
                      >
                        {project.shortDescription}
                      </Text>
                      <Text
                        className="text-lg font-semibold text-gray-900 mb-2"
                        numberOfLines={1}
                      >
                        {project.title}
                      </Text>

                      {/* Skills Tags */}
                      <View className="flex-row flex-wrap gap-2 mb-3">
                        {project.requiredSkills
                          ?.slice(0, 3)
                          .map((skill, index) => (
                            <View
                              key={index}
                              className="bg-gray-200 px-3 py-1 rounded-full"
                            >
                              <Text className="text-xs text-gray-700">
                                {skill}
                              </Text>
                            </View>
                          ))}
                      </View>

                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Feather name="users" size={14} color="#6b7280" />
                          <Text className="text-sm text-gray-500 ml-2">
                            {project.memberCount || 1}/{project.maxTeamSize}
                          </Text>
                        </View>
                        <View
                          className={`px-3 py-1 rounded-full ${
                            project.status === "open"
                              ? "bg-green-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              project.status === "open"
                                ? "text-green-700"
                                : "text-gray-700"
                            }`}
                          >
                            {project.status === "open" ? "Open" : "Closed"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Stats Grid */}
        <View className="px-6 py-4">
          <View className="flex-row flex-wrap gap-3">
            {/* Active Projects */}
            <View className="flex-1 min-w-[45%] bg-blue-50 rounded-2xl p-4">
              <Feather name="folder" size={24} color="#3b82f6" />
              <Text className="text-2xl font-bold text-gray-900 mt-3">
                {allProjects.length}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                Active Projects
              </Text>
              <Text className="text-xs text-gray-500 mt-1">Total projects</Text>
            </View>

            {/* Study Circles */}
            <View className="flex-1 min-w-[45%] bg-green-50 rounded-2xl p-4">
              <Feather name="users" size={24} color="#10b981" />
              <Text className="text-2xl font-bold text-gray-900 mt-3">
                {firebaseData?.studyCircles || 3}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">Study Circles</Text>
              <Text className="text-xs text-gray-500 mt-1">Member of</Text>
            </View>

            {/* Attendance */}
            <View className="flex-1 min-w-[45%] bg-purple-50 rounded-2xl p-4">
              <Feather name="target" size={24} color="#8b5cf6" />
              <Text className="text-2xl font-bold text-gray-900 mt-3">87%</Text>
              <Text className="text-sm text-gray-600 mt-1">Attendance</Text>
              <Text className="text-xs text-gray-500 mt-1">This month</Text>
            </View>

            {/* Upcoming Events */}
            <View className="flex-1 min-w-[45%] bg-orange-50 rounded-2xl p-4">
              <Feather name="calendar" size={24} color="#f97316" />
              <Text className="text-2xl font-bold text-gray-900 mt-3">
                {firebaseData?.upcomingEvents || 8}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                Upcoming Events
              </Text>
              <Text className="text-xs text-gray-500 mt-1">Next 7 days</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </Text>
          <View className="gap-3">
            {/* Create Project */}
            <TouchableOpacity
              onPress={() => navigation.navigate("CreateProject")}
              className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4"
            >
              <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center">
                <Feather name="folder" size={20} color="#3b82f6" />
              </View>
              <Text className="text-base text-gray-900 ml-4 flex-1">
                Create Project
              </Text>
              <Feather name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            {/* Join Study Circle */}
            <TouchableOpacity
              onPress={() => navigation.navigate("StudyCircles")}
              className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4"
            >
              <View className="w-10 h-10 bg-green-100 rounded-lg items-center justify-center">
                <Feather name="users" size={20} color="#10b981" />
              </View>
              <Text className="text-base text-gray-900 ml-4 flex-1">
                Join Study Circle
              </Text>
              <Feather name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            {/* Community Feed - NEW */}
            <TouchableOpacity
              onPress={() => navigation.navigate("CommunityList")}
              className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4"
            >
              <View className="w-10 h-10 bg-pink-100 rounded-lg items-center justify-center">
                <Feather name="hash" size={20} color="#ec4899" />
              </View>
              <Text className="text-base text-gray-900 ml-4 flex-1">
                Community Feed
              </Text>
              <Feather name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            {/* Mark Attendance */}
            <TouchableOpacity
              onPress={() => navigation.navigate("Attendance")}
              className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4"
            >
              <View className="w-10 h-10 bg-purple-100 rounded-lg items-center justify-center">
                <Feather name="check-circle" size={20} color="#8b5cf6" />
              </View>
              <Text className="text-base text-gray-900 ml-4 flex-1">
                Mark Attendance
              </Text>
              <Feather name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            {/* Browse Events */}
            <TouchableOpacity
              onPress={() => navigation.navigate("BrowseEvents")}
              className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4"
            >
              <View className="w-10 h-10 bg-orange-100 rounded-lg items-center justify-center">
                <Feather name="calendar" size={20} color="#f97316" />
              </View>
              <Text className="text-base text-gray-900 ml-4 flex-1">
                Browse Events
              </Text>
              <Feather name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Stats */}
        <View className="px-6 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Your Stats
          </Text>

          {/* Profile Completeness */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">
                Profile Completeness
              </Text>
              <Text className="text-sm font-semibold text-gray-900">
                {firebaseData?.profileCompleted ? "100%" : "85%"}
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-600 rounded-full"
                style={{
                  width: firebaseData?.profileCompleted ? "100%" : "85%",
                }}
              />
            </View>
          </View>

          {/* Weekly Study Goal */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-600">Weekly Study Goal</Text>
              <Text className="text-sm font-semibold text-gray-900">
                12/15 hrs
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-green-600 rounded-full"
                style={{ width: "80%" }}
              />
            </View>
          </View>

          {/* Recent Achievement */}
          <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex-row items-center">
            <View className="w-8 h-8 bg-yellow-400 rounded-full items-center justify-center">
              <Text className="text-lg">🏆</Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-gray-900">
                Recent Achievement
              </Text>
              <Text className="text-xs text-gray-600 mt-1">
                Completed 5 projects this semester!
              </Text>
            </View>
          </View>
        </View>

        {/* Suggested Connections */}
        <View className="px-6 py-4 pb-24">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Suggested Connections
          </Text>
          <View className="gap-3">
            {[
              {
                name: "Alex Turner",
                major: "CS Major, 3rd Year",
                initials: "AT",
              },
              {
                name: "Maya Patel",
                major: "CS Major, 3rd Year",
                initials: "MP",
              },
              {
                name: "Chris Lee",
                major: "CS Major, 3rd Year",
                initials: "CL",
              },
            ].map((person, index) => (
              <View
                key={index}
                className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4"
              >
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                  <Text className="text-sm font-semibold text-blue-600">
                    {person.initials}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-semibold text-gray-900">
                    {person.name}
                  </Text>
                  <Text className="text-xs text-gray-500">{person.major}</Text>
                </View>
                <TouchableOpacity className="w-8 h-8 border border-gray-300 rounded-full items-center justify-center">
                  <Feather name="plus" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeDashboard;
