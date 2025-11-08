import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import {
  fetchGithubProfile,
  fetchGithubRepos,
  fetchGithubStats,
} from "../../services/githubService";

const Profile = ({ navigation }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useAuth();
  const [firebaseData, setFirebaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [githubData, setGithubData] = useState(null);
  const [githubRepos, setGithubRepos] = useState([]);
  const [githubStats, setGithubStats] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);

  // Load user data from Firebase
  const loadUserData = async () => {
    try {
      if (user && db) {
        const userRef = doc(db, "users", user.id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setFirebaseData(data);

          // If user has GitHub link, fetch GitHub data
          if (data.githubLink) {
            await loadGithubData(data.githubLink);
          }
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load GitHub data
  const loadGithubData = async (githubLink) => {
    setGithubLoading(true);
    try {
      const [profile, repos, stats] = await Promise.all([
        fetchGithubProfile(githubLink),
        fetchGithubRepos(githubLink, 6),
        fetchGithubStats(githubLink),
      ]);

      setGithubData(profile);
      setGithubRepos(repos || []);
      setGithubStats(stats);
    } catch (error) {
      console.error("Error loading GitHub data:", error);
    } finally {
      setGithubLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await signOut();
            navigation.replace("Login");
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
        style: "destructive",
      },
    ]);
  };

  // Open URL in browser
  const openURL = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Error opening URL:", error);
    }
  };

  if (!userLoaded || loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 16,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1f2937" }}>
          Profile
        </Text>
        <TouchableOpacity onPress={handleLogout}>
          <Feather name="log-out" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={{ backgroundColor: "#fff", paddingVertical: 32, paddingHorizontal: 24 }}>
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            {/* Avatar */}
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: "#3b82f6",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 40, fontWeight: "700", color: "#fff" }}>
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </Text>
            </View>

            {/* Name */}
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#1f2937", marginBottom: 4 }}>
              {firebaseData?.firstName} {firebaseData?.lastName}
            </Text>

            {/* Username */}
            <Text style={{ fontSize: 16, color: "#6b7280", marginBottom: 8 }}>
              @{firebaseData?.username}
            </Text>

            {/* Email */}
            <Text style={{ fontSize: 14, color: "#9ca3af" }}>{firebaseData?.email}</Text>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "700", color: "#1f2937" }}>
                {firebaseData?.projectsCompleted || 0}
              </Text>
              <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Projects</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "700", color: "#1f2937" }}>
                {firebaseData?.studyCircles || 0}
              </Text>
              <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Circles</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "700", color: "#1f2937" }}>
                {firebaseData?.connections || 0}
              </Text>
              <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Connections</Text>
            </View>
          </View>
        </View>

        {/* GitHub Section */}
        {firebaseData?.githubLink && (
          <View style={{ backgroundColor: "#fff", marginTop: 8, paddingVertical: 24, paddingHorizontal: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
              <Feather name="github" size={24} color="#1f2937" />
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#1f2937", marginLeft: 12 }}>
                GitHub Profile
              </Text>
            </View>

            {githubLoading ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text style={{ color: "#6b7280", marginTop: 12 }}>Loading GitHub data...</Text>
              </View>
            ) : githubData ? (
              <>
                {/* GitHub Profile Card */}
                <View
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                    <Image
                      source={{ uri: githubData.avatar }}
                      style={{ width: 60, height: 60, borderRadius: 30, marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: "700", color: "#1f2937", marginBottom: 4 }}>
                        {githubData.name || githubData.username}
                      </Text>
                      <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
                        @{githubData.username}
                      </Text>
                      <TouchableOpacity
                        onPress={() => openURL(githubData.profileUrl)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#1f2937",
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          alignSelf: "flex-start",
                        }}
                      >
                        <Feather name="external-link" size={14} color="#fff" />
                        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600", marginLeft: 6 }}>
                          View Profile
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {githubData.bio && (
                    <Text style={{ fontSize: 14, color: "#4b5563", marginBottom: 16 }}>
                      {githubData.bio}
                    </Text>
                  )}

                  {/* GitHub Stats */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                    <View
                      style={{
                        flex: 1,
                        minWidth: "45%",
                        backgroundColor: "#fff",
                        padding: 12,
                        borderRadius: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 20, fontWeight: "700", color: "#3b82f6" }}>
                        {githubData.publicRepos}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Repositories</Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        minWidth: "45%",
                        backgroundColor: "#fff",
                        padding: 12,
                        borderRadius: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 20, fontWeight: "700", color: "#10b981" }}>
                        {githubData.followers}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Followers</Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        minWidth: "45%",
                        backgroundColor: "#fff",
                        padding: 12,
                        borderRadius: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 20, fontWeight: "700", color: "#f59e0b" }}>
                        {githubStats?.totalStars || 0}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Total Stars</Text>
                    </View>
                    <View
                      style={{
                        flex: 1,
                        minWidth: "45%",
                        backgroundColor: "#fff",
                        padding: 12,
                        borderRadius: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 20, fontWeight: "700", color: "#8b5cf6" }}>
                        {githubData.following}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Following</Text>
                    </View>
                  </View>

                  {/* Location, Company, etc. */}
                  <View style={{ marginTop: 16, gap: 8 }}>
                    {githubData.location && (
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Feather name="map-pin" size={14} color="#6b7280" />
                        <Text style={{ fontSize: 14, color: "#4b5563", marginLeft: 8 }}>
                          {githubData.location}
                        </Text>
                      </View>
                    )}
                    {githubData.company && (
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Feather name="briefcase" size={14} color="#6b7280" />
                        <Text style={{ fontSize: 14, color: "#4b5563", marginLeft: 8 }}>
                          {githubData.company}
                        </Text>
                      </View>
                    )}
                    {githubData.blog && (
                      <TouchableOpacity
                        onPress={() => openURL(githubData.blog)}
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Feather name="link" size={14} color="#3b82f6" />
                        <Text style={{ fontSize: 14, color: "#3b82f6", marginLeft: 8 }}>
                          {githubData.blog}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Top Languages */}
                {githubStats?.languages && githubStats.languages.length > 0 && (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#1f2937", marginBottom: 12 }}>
                      Top Languages
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {githubStats.languages.slice(0, 8).map((lang, index) => (
                        <View
                          key={index}
                          style={{
                            backgroundColor: "#3b82f6",
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 20,
                          }}
                        >
                          <Text style={{ fontSize: 12, color: "#fff", fontWeight: "600" }}>{lang}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Recent Repositories */}
                {githubRepos.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#1f2937", marginBottom: 12 }}>
                      Recent Repositories
                    </Text>
                    <View style={{ gap: 12 }}>
                      {githubRepos.map((repo) => (
                        <TouchableOpacity
                          key={repo.id}
                          onPress={() => openURL(repo.url)}
                          style={{
                            backgroundColor: "#f9fafb",
                            borderRadius: 12,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: "#e5e7eb",
                          }}
                        >
                          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{ fontSize: 15, fontWeight: "600", color: "#1f2937", marginBottom: 4 }}
                                numberOfLines={1}
                              >
                                {repo.name}
                              </Text>
                              {repo.description && (
                                <Text style={{ fontSize: 13, color: "#6b7280" }} numberOfLines={2}>
                                  {repo.description}
                                </Text>
                              )}
                            </View>
                          </View>

                          <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 8 }}>
                            {repo.language && (
                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View
                                  style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: "#3b82f6",
                                    marginRight: 6,
                                  }}
                                />
                                <Text style={{ fontSize: 12, color: "#6b7280" }}>{repo.language}</Text>
                              </View>
                            )}
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <Feather name="star" size={14} color="#f59e0b" />
                              <Text style={{ fontSize: 12, color: "#6b7280", marginLeft: 4 }}>{repo.stars}</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <Feather name="git-branch" size={14} color="#6b7280" />
                              <Text style={{ fontSize: 12, color: "#6b7280", marginLeft: 4 }}>{repo.forks}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View
                style={{
                  paddingVertical: 40,
                  alignItems: "center",
                  backgroundColor: "#f9fafb",
                  borderRadius: 16,
                }}
              >
                <Feather name="alert-circle" size={48} color="#d1d5db" />
                <Text style={{ color: "#6b7280", marginTop: 12, textAlign: "center" }}>
                  Unable to load GitHub data
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Edit Profile Button */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>
          <TouchableOpacity
            style={{
              backgroundColor: "#3b82f6",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
