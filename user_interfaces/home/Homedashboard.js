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
import { LinearGradient } from "expo-linear-gradient";
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
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Minimal Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View>
              <Text style={{ fontSize: 14, color: "#666", marginBottom: 8, letterSpacing: 2 }}>
                DASHBOARD
              </Text>
              <Text style={{ fontSize: 36, fontWeight: "300", color: "#fff", letterSpacing: -1 }}>
                {firebaseData?.firstName || "Hello"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#111",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#222",
              }}
            >
              <Feather name="log-out" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Section - Minimal Card */}
        <View style={{ paddingHorizontal: 24, marginBottom: 48 }}>
          <View
            style={{
              backgroundColor: "#111",
              borderRadius: 24,
              padding: 32,
              borderWidth: 1,
              borderColor: "#1a1a1a",
            }}
          >
            {/* Initials Circle */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: "#fff",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 28, fontWeight: "600", color: "#0a0a0a" }}>
                {firebaseData?.firstName?.charAt(0) || "U"}
                {firebaseData?.lastName?.charAt(0) || ""}
              </Text>
            </View>

            {/* Name */}
            <Text style={{ fontSize: 24, fontWeight: "400", color: "#fff", marginBottom: 4 }}>
              {firebaseData?.firstName && firebaseData?.lastName
                ? `${firebaseData.firstName} ${firebaseData.lastName}`
                : "User"}
            </Text>

            {/* Email */}
            <Text style={{ fontSize: 14, color: "#666", marginBottom: 2 }}>
              {firebaseData?.email || user?.primaryEmailAddress?.emailAddress}
            </Text>

            {/* Username */}
            {firebaseData?.username && (
              <Text style={{ fontSize: 13, color: "#444", marginTop: 4 }}>
                @{firebaseData.username}
              </Text>
            )}
          </View>
        </View>

        {/* Actions - Minimal List */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 60 }}>
          <Text style={{ fontSize: 11, color: "#666", marginBottom: 16, letterSpacing: 2 }}>
            QUICK ACTIONS
          </Text>

          {/* Edit Profile */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 18,
              borderBottomWidth: 1,
              borderBottomColor: "#1a1a1a",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="edit-3" size={16} color="#fff" />
              <Text style={{ color: "#fff", marginLeft: 16, fontSize: 15, fontWeight: "400" }}>
                Edit Profile
              </Text>
            </View>
            <Feather name="arrow-right" size={16} color="#444" />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 18,
              borderBottomWidth: 1,
              borderBottomColor: "#1a1a1a",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="bell" size={16} color="#fff" />
              <Text style={{ color: "#fff", marginLeft: 16, fontSize: 15, fontWeight: "400" }}>
                Notifications
              </Text>
            </View>
            <Feather name="arrow-right" size={16} color="#444" />
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 18,
              borderBottomWidth: 1,
              borderBottomColor: "#1a1a1a",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="settings" size={16} color="#fff" />
              <Text style={{ color: "#fff", marginLeft: 16, fontSize: 15, fontWeight: "400" }}>
                Settings
              </Text>
            </View>
            <Feather name="arrow-right" size={16} color="#444" />
          </TouchableOpacity>

          {/* Help */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 18,
              borderBottomWidth: 1,
              borderBottomColor: "#1a1a1a",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="help-circle" size={16} color="#fff" />
              <Text style={{ color: "#fff", marginLeft: 16, fontSize: 15, fontWeight: "400" }}>
                Help & Support
              </Text>
            </View>
            <Feather name="arrow-right" size={16} color="#444" />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 18,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather name="log-out" size={16} color="#ef4444" />
              <Text style={{ color: "#ef4444", marginLeft: 16, fontSize: 15, fontWeight: "400" }}>
                Logout
              </Text>
            </View>
            <Feather name="arrow-right" size={16} color="#444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeDashboard;
