import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.config";

const CommunityDetails = ({ route, navigation }) => {
  const { communityId } = route.params;
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const communityRef = doc(db, "communities", communityId);
        const snapshot = await getDoc(communityRef);
        if (snapshot.exists()) {
          setCommunity({ id: snapshot.id, ...snapshot.data() });
        }
      } catch (error) {
        console.error("Error loading community:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [communityId]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (!community) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Community not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>{community.name}</Text>
      <Text style={{ fontSize: 16, color: "#555", marginBottom: 12 }}>{community.description}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <Feather name="users" size={20} color="#3b82f6" />
        <Text style={{ marginLeft: 8 }}>{(community.members?.length || 0)} members</Text>
      </View>
      {/* Optionally list members here */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, padding: 12, backgroundColor: "#3b82f6", borderRadius: 8 }}>
        <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default CommunityDetails;
