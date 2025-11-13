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

const { width } = Dimensions.get("window");

const HomeDashboard = ({ navigation }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut, isLoaded: authLoaded } = useAuth();

  const [firebaseData, setFirebaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [allProjects, setAllProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [connections, setConnections] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);

  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showAllUsers, setShowAllUsers] = useState(false);

  const insets = useSafeAreaInsets();

  const fetchAllUsers = async () => {
    if (!user || !db) return;
    try {
      setUsersLoading(true);
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("__name__", "!=", user.id)
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
    if (!user || !db) return;
    try {
      setConnectionsLoading(true);
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

  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (user && db) {
          const userRef = doc(db, "users", user.id);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setFirebaseData(data);
            await fetchConnections();
            await fetchAllUsers();
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
      Alert.alert("Success", "Connected successfully!");
      // Refresh connections to show the new connection
      await fetchConnections();
    } catch (error) {
      console.error("Error adding connection:", error);
      Alert.alert("Error", "Failed to add connection. Please try again.");
    }
  };

  // Filter out already connected users from suggested connections
  const suggestedUsers = allUsers.filter(
    (user) => !connections.find((conn) => conn.id === user.id)
  );

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
      {/* Header */}
      <View style={styles.header}>
        {/* Brand Name */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>
            mitra<Text style={styles.brandAccent}>circle</Text>
          </Text>
        </View>

        {/* User Info with Avatar */}
        <TouchableOpacity 
          onPress={() => navigation.navigate("Profile")}
          style={styles.userInfoContainer}
          activeOpacity={0.7}
        >
          <View style={styles.userTextContainer}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.primaryEmailAddress?.emailAddress}
            </Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </Text>
          </View>
        </TouchableOpacity>
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
          </TouchableOpacity>
        </View>          {projectsLoading ? (
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
                      navigation.navigate("ProjectDetails", { projectId: project.id })
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Connections ({connections.length})</Text>
          </View>
          {connectionsLoading ? (
            <ActivityIndicator
              size="small"
              color="#3b82f6"
              style={{ marginVertical: 16 }}
            />
          ) : connections.length === 0 ? (
            <View style={styles.emptyConnectionsCard}>
              <Feather name="users" size={40} color="#d1d5db" />
              <Text style={styles.emptyConnectionsText}>
                No connections yet
              </Text>
              <Text style={styles.emptyConnectionsSubtext}>
                Start connecting with people below!
              </Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {connections.map((person) => (
                <TouchableOpacity 
                  key={person.id} 
                  style={styles.connectionCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.connectionAvatar}>
                    <Text style={styles.connectionInitials}>
                      {person.firstName?.[0]}
                      {person.lastName?.[0]}
                    </Text>
                  </View>
                  <Text style={styles.connectionName} numberOfLines={1}>
                    {person.firstName} {person.lastName}
                  </Text>
                  <Text style={styles.connectionDomain} numberOfLines={1}>
                    {person.domain || "Student"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Add Connections Section */}
        <View style={styles.usersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested Connections</Text>
            {!showAllUsers && suggestedUsers.length > 3 && (
              <TouchableOpacity
                onPress={() => setShowAllUsers(true)}
                style={styles.viewAllBtn}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Feather name="arrow-right" size={16} color="#3b82f6" />
              </TouchableOpacity>
            )}
          </View>
          {usersLoading ? (
            <ActivityIndicator
              size="small"
              color="#3b82f6"
              style={{ marginVertical: 16 }}
            />
          ) : suggestedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="check-circle" size={48} color="#10b981" />
              <Text style={styles.emptyStateText}>
                {allUsers.length === 0 
                  ? "No users found" 
                  : "You're connected with everyone!"}
              </Text>
            </View>
          ) : (
            <>
              {showAllUsers ? (
                // Grid view for all users
                <View style={styles.suggestedUsersGrid}>
                  {suggestedUsers.map((person) => (
                    <View key={person.id} style={styles.suggestedUserCard}>
                      <View style={styles.suggestedUserAvatar}>
                        <Text style={styles.suggestedUserInitials}>
                          {person.firstName?.[0]}
                          {person.lastName?.[0]}
                        </Text>
                      </View>
                      <Text style={styles.suggestedUserName} numberOfLines={1}>
                        {person.firstName}
                      </Text>
                      <Text style={styles.suggestedUserLastName} numberOfLines={1}>
                        {person.lastName}
                      </Text>
                      <Text style={styles.suggestedUserDomain} numberOfLines={1}>
                        {person.domain || "Student"}
                      </Text>
                      <TouchableOpacity
                        style={styles.connectButton}
                        onPress={() => addConnection(person.id)}
                        activeOpacity={0.7}
                      >
                        <Feather name="user-plus" size={14} color="#fff" />
                        <Text style={styles.connectButtonText}>Connect</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                // Horizontal scroll for preview
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                >
                  {suggestedUsers.slice(0, 6).map((person) => (
                    <View key={person.id} style={styles.suggestedUserCard}>
                      <View style={styles.suggestedUserAvatar}>
                        <Text style={styles.suggestedUserInitials}>
                          {person.firstName?.[0]}
                          {person.lastName?.[0]}
                        </Text>
                      </View>
                      <Text style={styles.suggestedUserName} numberOfLines={1}>
                        {person.firstName}
                      </Text>
                      <Text style={styles.suggestedUserLastName} numberOfLines={1}>
                        {person.lastName}
                      </Text>
                      <Text style={styles.suggestedUserDomain} numberOfLines={1}>
                        {person.domain || "Student"}
                      </Text>
                      <TouchableOpacity
                        style={styles.connectButton}
                        onPress={() => addConnection(person.id)}
                        activeOpacity={0.7}
                      >
                        <Feather name="user-plus" size={14} color="#fff" />
                        <Text style={styles.connectButtonText}>Connect</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
              {!showAllUsers && suggestedUsers.length > 6 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllUsers(true)}
                >
                  <Text style={styles.showMoreText}>
                    Show {suggestedUsers.length - 6} more
                  </Text>
                  <Feather name="chevron-down" size={18} color="#3b82f6" />
                </TouchableOpacity>
              )}
              {showAllUsers && suggestedUsers.length > 6 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllUsers(false)}
                >
                  <Text style={styles.showMoreText}>Show less</Text>
                  <Feather name="chevron-up" size={18} color="#3b82f6" />
                </TouchableOpacity>
              )}
            </>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  brandContainer: {
    flex: 1,
  },
  brandText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1d4ed8",
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: "#8b5cf6",
    fontWeight: "900",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  userTextContainer: {
    alignItems: "flex-end",
    maxWidth: 150,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    letterSpacing: -0.2,
  },
  userEmail: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: "#1d4ed8",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
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
    paddingBottom: 24,
  },
  emptyConnectionsCard: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    marginTop: 8,
  },
  emptyConnectionsText: {
    color: "#1f2937",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyConnectionsSubtext: {
    color: "#6b7280",
    marginTop: 4,
    fontSize: 13,
  },
  connectionCard: {
    width: 120,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  connectionAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  connectionInitials: { 
    fontSize: 20, 
    color: "#2563eb", 
    fontWeight: "bold" 
  },
  connectionName: { 
    fontWeight: "600", 
    fontSize: 13, 
    color: "#111827",
    textAlign: "center",
    marginBottom: 2,
  },
  connectionDomain: { 
    fontSize: 11, 
    color: "#6b7280",
    textAlign: "center",
  },
  usersSection: { 
    paddingHorizontal: 16, 
    paddingTop: 16, 
    paddingBottom: 32 
  },
  suggestedUsersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  suggestedUserCard: {
    width: 110,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestedUserAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  suggestedUserInitials: { 
    fontSize: 18, 
    color: "#4f46e5", 
    fontWeight: "bold" 
  },
  suggestedUserName: { 
    fontWeight: "600", 
    fontSize: 12, 
    color: "#111827",
    textAlign: "center",
  },
  suggestedUserLastName: { 
    fontWeight: "400", 
    fontSize: 12, 
    color: "#111827",
    textAlign: "center",
    marginBottom: 2,
  },
  suggestedUserDomain: { 
    fontSize: 10, 
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 8,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  connectButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
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
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    marginTop: 8,
  },
  emptyStateText: {
    color: "#6b7280",
    marginTop: 12,
    fontSize: 14,
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  showMoreText: {
    color: "#3b82f6",
    fontWeight: "600",
    fontSize: 14,
    marginRight: 6,
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
