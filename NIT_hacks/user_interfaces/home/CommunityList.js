import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../../firebase.config";

const CommunityList = ({ navigation }) => {
  const { user } = useUser();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningCommunity, setJoiningCommunity] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const communitiesRef = collection(db, "communities");
    const q = query(communitiesRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, snapshot => {
      const list = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setCommunities(list);
      setLoading(false);
    }, error => {
      console.error(error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredCommunities = communities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const toggleJoin = async (community) => {
    if (!user) return;
    setJoiningCommunity(community.id);
    const communityRef = doc(db, "communities", community.id);
    try {
      if (community.members?.includes(user.id)) {
        await updateDoc(communityRef, { members: arrayRemove(user.id) });
        Alert.alert("Left community", `You left ${community.name}`);
      } else {
        await updateDoc(communityRef, { members: arrayUnion(user.id) });
        Alert.alert("Joined community", `You joined ${community.name}`);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update membership");
    } finally {
      setJoiningCommunity(null);
    }
  };

  const renderItem = ({ item }) => {
    const isMember = item.members?.includes(user.id);
    return (
      <View style={{ padding: 12, borderBottomWidth: 1, borderColor: "#ddd" }}>
        <TouchableOpacity onPress={() => navigation.navigate("CommunityFeed", { communityId: item.id, communityName: item.name })}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.name}</Text>
          <Text numberOfLines={2} style={{ color: "#555" }}>{item.description}</Text>
          <Text style={{ color: "#666" }}>{item.members?.length || 0} members</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => toggleJoin(item)}
          disabled={joiningCommunity === item.id}
          style={{
            marginTop: 6,
            paddingVertical: 8,
            backgroundColor: isMember ? "#aaa" : "#3b82f6",
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white" }}>{joiningCommunity === item.id ? "Processing..." : (isMember ? "Leave" : "Join")}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        placeholder="Search communities"
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          margin: 12,
          borderRadius: 8,
        }}
      />
      <FlatList
        data={filteredCommunities}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 30,
          right: 30,
          backgroundColor: "#3b82f6",
          padding: 16,
          borderRadius: 32,
          elevation: 5,
        }}
        onPress={() => navigation.navigate("CreateCommunity")}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Create</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CommunityList;
