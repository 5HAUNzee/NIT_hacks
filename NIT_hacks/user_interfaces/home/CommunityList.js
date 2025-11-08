import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
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
    const memberCount = item.members?.length || 0;

    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate("CommunityFeed", { communityId: item.id, communityName: item.name })}
        style={styles.communityCard}
        activeOpacity={0.7}
      >
        {/* Community Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.communityIcon, { backgroundColor: getIconColor(item.name) }]}>
            <Text style={styles.iconText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Community Info */}
        <View style={styles.communityInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.communityName} numberOfLines={1}>
              {item.name}
            </Text>
            {isMember && (
              <View style={styles.memberBadge}>
                <Feather name="check-circle" size={14} color="#10b981" />
                <Text style={styles.memberBadgeText}>Joined</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.communityDescription} numberOfLines={2}>
            {item.description || "No description available"}
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Feather name="users" size={14} color="#6b7280" />
              <Text style={styles.statText}>
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </Text>
            </View>
            
            {item.category && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Join/Leave Button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            toggleJoin(item);
          }}
          disabled={joiningCommunity === item.id}
          style={[
            styles.joinButton,
            isMember ? styles.leaveButton : styles.joinButtonActive
          ]}
        >
          {joiningCommunity === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather 
              name={isMember ? "user-minus" : "user-plus"} 
              size={18} 
              color="#fff" 
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const getIconColor = (name) => {
    const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#6366f1"];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Communities</Text>
          <Text style={styles.headerSubtitle}>
            {filteredCommunities.length} {filteredCommunities.length === 1 ? "community" : "communities"}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate("CreateCommunity")}
          style={styles.headerButton}
        >
          <Feather name="plus" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          placeholder="Search communities..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInput}
          placeholderTextColor="#9ca3af"
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm("")} style={styles.clearButton}>
            <Feather name="x" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Communities List */}
      {filteredCommunities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="inbox" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>
            {searchTerm ? "No communities found" : "No communities yet"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchTerm ? "Try a different search term" : "Be the first to create one!"}
          </Text>
          {!searchTerm && (
            <TouchableOpacity
              onPress={() => navigation.navigate("CreateCommunity")}
              style={styles.createButton}
            >
              <Text style={styles.createButtonText}>Create Community</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredCommunities}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      {filteredCommunities.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("CreateCommunity")}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  headerButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  communityCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  iconContainer: {
    marginRight: 12,
  },
  communityIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  communityInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  communityName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  memberBadgeText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
    marginLeft: 4,
  },
  communityDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  statText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 4,
  },
  categoryTag: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    color: "#7c3aed",
    fontWeight: "500",
  },
  joinButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  joinButtonActive: {
    backgroundColor: "#3b82f6",
  },
  leaveButton: {
    backgroundColor: "#6b7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default CommunityList;
