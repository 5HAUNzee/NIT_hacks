import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useUser, useAuth } from "@clerk/clerk-expo";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  where,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import ProfileSetupModal from "./ProfileSetupModal";

const { width } = Dimensions.get("window");

const HomeDashboard = ({ navigation }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut, isLoaded: authLoaded } = useAuth();

  const [firebaseData, setFirebaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const [allProjects, setAllProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [connections, setConnections] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);

  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (user && db) {
          const userRef = doc(db, "users", user.id);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setFirebaseData(data);
            if (!data.profileCompleted) setShowProfileSetup(true);
            await fetchAllUsers();
            await fetchConnections();
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAllProjects = async () => {
      try {
        const projectsRef = collection(db, "projects");
        const q = query(projectsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) =>
          list.push({ id: doc.id, ...doc.data() })
        );
        setAllProjects(list);
      } catch (e) {
        console.error("Error fetching projects:", e);
      } finally {
        setProjectsLoading(false);
      }
    };

    const fetchAllUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("__name__", "!=", user.id),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const list = [];
        querySnapshot.forEach((doc) =>
          list.push({ id: doc.id, ...doc.data() })
        );
        setAllUsers(list);
      } catch (e) {
        console.error("Error fetching users:", e);
      } finally {
        setUsersLoading(false);
      }
    };

    const fetchConnections = async () => {
      try {
        const connectionsRef = collection(db, "connections");
        const q = query(connectionsRef, where("ownerId", "==", user.id));
        const snapshot = await getDocs(q);
        const connectedUserIds = snapshot.docs.map(
          (doc) => doc.data().connectedUserId
        );
        if (connectedUserIds.length === 0) {
          setConnections([]);
          setConnectionsLoading(false);
          return;
        }
        const usersRef = collection(db, "users");
        const usersQuery = query(
          usersRef,
          where("__name__", "in", connectedUserIds)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const connectedUsers = [];
        usersSnapshot.forEach((doc) =>
          connectedUsers.push({ id: doc.id, ...doc.data() })
        );
        setConnections(connectedUsers);
      } catch (e) {
        console.error("Error fetching connections:", e);
      } finally {
        setConnectionsLoading(false);
      }
    };

    if (user) {
      loadUserData();
      fetchAllProjects();
    }
  }, [user]);

  const addConnection = async (connectedUserId) => {
    if (!user) return;
    if (connections.find((c) => c.id === connectedUserId)) {
      Alert.alert("Already connected");
      return;
    }
    try {
      await addDoc(collection(db, "connections"), {
        ownerId: user.id,
        connectedUserId,
        createdAt: new Date(),
      });
      Alert.alert("Connected successfully!");
      await fetchConnections();
    } catch (error) {
      console.error("Error adding connection:", error);
      Alert.alert("Failed to add connection");
    }
  };

  if (!userLoaded || !authLoaded || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProfileSetupModal
        visible={showProfileSetup}
        onComplete={() => setShowProfileSetup(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            style={styles.profileCircle}
          >
            <Text style={styles.profileInitials}>
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </Text>
          </TouchableOpacity>
          {/* Logout button */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Logout", "Are you sure you want to log out?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Logout",
                  style: "destructive",
                  onPress: () => {
                    signOut().catch((err) =>
                      Alert.alert("Error", "Failed to log out: " + err.message)
                    );
                  },
                },
              ]);
            }}
            style={{
              marginLeft: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Feather name="log-out" size={20} color="#ef4444" />
            <Text style={{ color: "#ef4444", fontWeight: "600" }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.card, { backgroundColor: "#DBEAFE" }]}>
            <Feather name="folder" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>{allProjects.length}</Text>
            <Text style={styles.statLabel}>Active Projects</Text>
            <Text style={styles.statSubLabel}>Total projects</Text>
          </View>

          <View style={[styles.card, { backgroundColor: "#DCFCE7" }]}>
            <Feather name="users" size={24} color="#10b981" />
            <Text style={styles.statNumber}>
              {firebaseData?.studyCircles || 0}
            </Text>
            <Text style={styles.statLabel}>Study Circles</Text>
            <Text style={styles.statSubLabel}>Member of</Text>
          </View>
        </View>

        {/* Projects Section */}
        <View style={styles.projectsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Projects ({allProjects.length})
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Projects")}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Feather name="arrow-right" size={16} color="#3b82f6" />
            </TouchableOpacity> */}
          </View>

          {projectsLoading ? (
            <View style={styles.loadingProjects}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading projects...</Text>
            </View>
          ) : allProjects.length === 0 ? (
            <View style={styles.noProjects}>
              <Feather name="folder" size={48} color="#d1d5db" />
              <Text style={styles.noProjectsText}>No projects yet</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("CreateProject")}
                style={styles.createFirstProjectBtn}
              >
                <Text style={styles.createFirstProjectText}>
                  Create First Project
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.projectList}>
                {allProjects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    onPress={() =>
                      navigation.navigate("ProjectDetails", {
                        projectId: project.id,
                      })
                    }
                    style={styles.projectCard}
                  >
                    <View style={styles.projectCardHeader}>
                      <Feather name="folder" size={40} color="#3b82f6" />
                    </View>
                    <View style={styles.projectCardBody}>
                      <Text style={styles.projectShortDesc} numberOfLines={1}>
                        {project.shortDescription}
                      </Text>
                      <Text style={styles.projectTitle} numberOfLines={1}>
                        {project.title}
                      </Text>
                      <View style={styles.skillTagsContainer}>
                        {project.requiredSkills
                          ?.slice(0, 3)
                          .map((skill, index) => (
                            <View key={index} style={styles.skillTag}>
                              <Text style={styles.skillTagText}>{skill}</Text>
                            </View>
                          ))}
                      </View>
                      <View style={styles.projectStats}>
                        <View style={styles.members}>
                          <Feather name="users" size={14} color="#6b7280" />
                          <Text style={styles.membersText}>
                            {project.memberCount || 1}/{project.maxTeamSize}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            project.status === "open"
                              ? styles.statusOpen
                              : styles.statusClosed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              project.status === "open"
                                ? styles.statusTextOpen
                                : styles.statusTextClosed,
                            ]}
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

        {/* Your Connections Section */}
        <View style={styles.connectionsSection}>
          <Text style={styles.sectionTitle}>Your Connections</Text>
          {connectionsLoading ? (
            <ActivityIndicator
              size="small"
              color="#3b82f6"
              style={{ marginVertical: 16 }}
            />
          ) : connections.length === 0 ? (
            <Text style={{ color: "#6b7280", marginVertical: 16 }}>
              You have no connections yet.
            </Text>
          ) : (
            connections.map((person) => (
              <View key={person.id} style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userInitials}>
                    {person.firstName?.[0]}
                    {person.lastName?.[0]}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {person.firstName} {person.lastName}
                  </Text>
                  <Text style={styles.userDomain}>
                    {person.domain || "No domain provided"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Add Connections Section */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>Add Connections</Text>
          {usersLoading ? (
            <ActivityIndicator
              size="small"
              color="#3b82f6"
              style={{ marginVertical: 16 }}
            />
          ) : allUsers.length === 0 ? (
            <Text style={{ color: "#6b7280", marginVertical: 16 }}>
              No users found.
            </Text>
          ) : (
            allUsers.map((person) => (
              <View key={person.id} style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userInitials}>
                    {person.firstName?.[0]}
                    {person.lastName?.[0]}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {person.firstName} {person.lastName}
                  </Text>
                  <Text style={styles.userDomain}>
                    {person.domain || "No domain provided"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.userAddButton}
                  onPress={() => addConnection(person.id)}
                >
                  <Feather name="plus" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Navbar Quick Actions */}
      <View
        style={[
          styles.floatingBarContainer,
          { paddingBottom: insets.bottom || 16 },
        ]}
      >
        <View style={styles.floatingBar}>
          <QuickActionButton
            icon="folder"
            label="Create"
            bg="#1f6feb"
            onPress={() => navigation.navigate("CreateProject")}
          />
          <QuickActionButton
            icon="users"
            label="Circle"
            bg="#10b981"
            onPress={() => navigation.navigate("StudyCircles")}
          />
          <QuickActionButton
            icon="hash"
            label="Feed"
            bg="#ec4899"
            onPress={() => navigation.navigate("Feed")}
          />
          <QuickActionButton
            icon="calendar"
            label="Events"
            bg="#f97316"
            onPress={() => navigation.navigate("Events")}
          />
          <QuickActionButton
            icon="users"
            label="Community"
            bg="#6366f1"
            onPress={() => navigation.navigate("CommunityList")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const QuickActionButton = ({ icon, label, onPress, bg }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.actionWrap}
    activeOpacity={0.85}
  >
    <View style={[styles.iconCircle, { backgroundColor: bg }]}>
      <Feather name={icon} size={20} color="#fff" />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 16 },
  bellIconContainer: { position: "relative" },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
  },
  profileCircle: {
    width: 40,
    height: 40,
    backgroundColor: "#bfdbfe",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: { color: "#2563eb", fontWeight: "bold" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 16,
    padding: 12,
    alignItems: "flex-start",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 6,
    color: "#111827",
  },
  statLabel: { fontSize: 12, color: "#4b5563", marginTop: 2 },
  statSubLabel: { fontSize: 10, color: "#6b7280", marginTop: 1 },
  projectsSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  viewAllBtn: { flexDirection: "row", alignItems: "center" },
  viewAllText: { color: "#3b82f6", fontWeight: "600", marginRight: 4 },
  loadingProjects: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 100,
  },
  loadingText: { marginTop: 8, color: "#6b7280" },
  noProjects: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  noProjectsText: { marginTop: 16, color: "#6b7280" },
  createFirstProjectBtn: {
    marginTop: 16,
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
  },
  createFirstProjectText: { color: "white", fontWeight: "600", fontSize: 14 },
  projectList: { flexDirection: "row", gap: 12 },
  projectCard: {
    width: 280,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    overflow: "hidden",
  },
  projectCardHeader: {
    height: 72,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  projectCardBody: { padding: 12 },
  projectTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "#111827",
  },
  projectShortDesc: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  skillTagsContainer: { flexDirection: "row", flexWrap: "wrap" },
  skillTag: {
    backgroundColor: "#e0e7ff",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  skillTagText: { fontSize: 11, color: "#3730a3", fontWeight: "600" },
  projectStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  members: { flexDirection: "row", alignItems: "center" },
  membersText: { color: "#6b7280", marginLeft: 6 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusOpen: { backgroundColor: "#d1fae5" },
  statusClosed: { backgroundColor: "#f3f4f6" },
  statusText: { fontWeight: "600", fontSize: 12 },
  statusTextOpen: { color: "#065f46" },
  statusTextClosed: { color: "#6b7280" },
  connectionsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  usersSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#bfdbfe",
    justifyContent: "center",
    alignItems: "center",
  },
  userInitials: { fontSize: 14, color: "#2563eb", fontWeight: "bold" },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontWeight: "600", fontSize: 14, color: "#111827" },
  userDomain: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  userAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderColor: "#d1d5db",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
    paddingBottom: 12,
  },
  floatingBar: {
    width: width,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  actionWrap: { alignItems: "center" },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    marginTop: 4,
    fontSize: 10,
    color: "#374151",
    fontWeight: "600",
  },
});

export default HomeDashboard;

const { width } = Dimensions.get("window");

const QuickActionButton = ({ icon, label, onPress, bg }) => (
  <TouchableOpacity onPress={onPress} style={styles.actionWrap} activeOpacity={0.85}>
    <View style={[styles.iconCircle, { backgroundColor: bg }]}> 
      <Feather name={icon} size={20} color="#fff" />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  floatingBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  floatingBar: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
    // shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 10,
  },
  actionWrap: {
    flex: 1,
    alignItems: "center",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
});
