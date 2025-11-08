import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../../firebase.config";
import { useUser } from "@clerk/clerk-expo";

const ProjectDetails = ({ route, navigation }) => {
  const { projectId } = route.params;
  const { user } = useUser();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [joining, setJoining] = useState(false);
  const [similarProjects, setSimilarProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  useEffect(() => {
    if (project?.currentMembers && activeTab === "Team") {
      fetchTeamMembers();
    }
  }, [project?.currentMembers, activeTab]);

  const fetchProjectDetails = async () => {
    try {
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);

      if (projectSnap.exists()) {
        const projectData = { id: projectSnap.id, ...projectSnap.data() };
        setProject(projectData);
        
        // Fetch similar projects based on domain
        fetchSimilarProjects(projectData.domain);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      Alert.alert("Error", "Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarProjects = async (domain) => {
    try {
      const projectsRef = collection(db, "projects");
      const q = query(
        projectsRef,
        where("domain", "==", domain),
        where("status", "==", "open"),
        limit(3)
      );
      const querySnapshot = await getDocs(q);
      
      const projects = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== projectId) { // Exclude current project
          projects.push({ id: doc.id, ...doc.data() });
        }
      });
      
      setSimilarProjects(projects.slice(0, 2)); // Show only 2
    } catch (error) {
      console.error("Error fetching similar projects:", error);
    }
  };

  const fetchTeamMembers = async () => {
    if (!project?.currentMembers || project.currentMembers.length === 0) {
      setTeamMembers([]);
      return;
    }

    try {
      setLoadingMembers(true);
      const membersData = [];
      
      for (const memberId of project.currentMembers) {
        const userRef = doc(db, "users", memberId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          membersData.push({ id: userSnap.id, ...userSnap.data() });
        }
      }
      
      setTeamMembers(membersData);
    } catch (error) {
      console.error("Error fetching team members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleJoinProject = async () => {
    if (!user) return;

    if (project.currentMembers?.includes(user.id)) {
      Alert.alert("Info", "You're already a member of this project");
      return;
    }

    if (project.memberCount >= project.maxTeamSize) {
      Alert.alert("Project Full", "This project has reached maximum team size");
      return;
    }

    Alert.alert(
      "Join Project",
      `Do you want to join "${project.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Join",
          onPress: async () => {
            try {
              setJoining(true);
              const projectRef = doc(db, "projects", projectId);
              await updateDoc(projectRef, {
                currentMembers: arrayUnion(user.id),
                memberCount: (project.memberCount || 1) + 1,
              });

              Alert.alert("Success", "You've joined the project!");
              fetchProjectDetails();
            } catch (error) {
              console.error("Error joining project:", error);
              Alert.alert("Error", "Failed to join project");
            } finally {
              setJoining(false);
            }
          },
        },
      ]
    );
  };

  const openLink = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-6">
          <Feather name="alert-circle" size={48} color="#9ca3af" />
          <Text className="text-gray-500 mt-4">Project not found</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mt-4 bg-blue-600 px-6 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isMember = project.currentMembers?.includes(user?.id);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView className="w-full" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="px-6 py-6 bg-gradient-to-br from-gray-900 to-gray-800">
          <View className="flex-row gap-2 mb-3">
            <View className="bg-blue-100 px-3 py-1 rounded-full">
              <Text className="text-xs text-blue-600 font-medium">
                {project.domain}
              </Text>
            </View>
            <View className="bg-green-100 px-3 py-1 rounded-full">
              <Text className="text-xs text-green-600 font-medium">
                {project.status === "open" ? "Active" : project.status}
              </Text>
            </View>

            {project.projectLinks?.github && (
              <TouchableOpacity
                onPress={() => openLink(project.projectLinks.github)}
                className="bg-gray-800 px-3 py-1 rounded-full flex-row items-center gap-1"
              >
                <Feather name="github" size={12} color="#fff" />
                <Text className="text-xs text-white font-medium">GitHub</Text>
              </TouchableOpacity>
            )}
          </View>

          

          {/* <Text className="text-2xl font-bold text-white mb-2">
            {project.title}
          </Text> */}
          {/* <Text className="text-sm text-gray-300 mb-4">
            {project.shortDescription}
          </Text> */}
        </View>

        {/* Required Skills */}
        <Text className="text-base font-semibold px-6 text-gray-900 mb-3">
            Required Skills
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6 px-6">
            {project.requiredSkills?.map((skill, index) => (
            <View key={index} className="bg-blue-50 px-3 py-2 rounded-lg">
                <Text className="text-sm text-blue-700">{skill}</Text>
            </View>
            ))}
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-gray-200 w-fit">
          {["Overview", "Team", "Discussion", "Resources"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3 ${
                activeTab === tab ? "border-b-2 border-blue-600 text-blue-600" : ""
              }`}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  activeTab === tab ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {activeTab === "Overview" && (
          <View className="px-6 py-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              About This Project
            </Text>
            <Text className="text-gray-700 leading-6 mb-6">
              {project.fullDescription}
            </Text>

            {/* Required Skills Section */}
            {/* <Text className="text-base font-semibold text-gray-900 mb-3">
              Required Skills
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {project.requiredSkills?.map((skill, index) => (
                <View key={index} className="bg-blue-50 px-3 py-2 rounded-lg">
                  <Text className="text-sm text-blue-700">{skill}</Text>
                </View>
              ))}
            </View> */}
          </View>
        )}

        {/* Open Roles */}
        {activeTab === "Overview" && project.openRoles && project.openRoles.length > 0 && (
          <View className="px-6 pb-6 w-fit">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              Open Roles
            </Text>
            {project.openRoles.map((role, index) => (
              <View
                key={index}
                className="bg-gray-50 rounded-xl p-4 mb-3 flex-row justify-between items-center w-[80%]"
              >
                <View className="w-full">
                  <Text className="text-wrap font-medium text-gray-900 mb-1">
                    {role.title}
                  </Text>
                  <View className="flex-row items-center">
                    <Feather name="users" size={14} color="#6b7280" />
                    <Text className="text-sm text-gray-600 ml-2">
                      {role.count} {role.count === "1" ? "position" : "positions"}
                    </Text>
                  </View>
                </View>
                <View className="bg-black px-4 py-2 rounded-lg">
                  <Text className="text-white text-xs font-medium">
                    {role.count} {role.count === "1" ? "position" : "positions"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Project Info Cards */}
        {activeTab === "Overview" && (
          <View className="px-6 pb-6">
            {/* Team Size */}
            <View className="flex-row items-center py-3 border-b border-gray-100">
              <Text className="text-gray-600 flex-1">Team Size</Text>
              <Text className="text-gray-900 font-medium">
                {project.memberCount || 1}/{project.maxTeamSize}
              </Text>
            </View>

            {/* Created */}
            <View className="flex-row items-center py-3 border-b border-gray-100">
              <Text className="text-gray-600 flex-1">Created</Text>
              <Text className="text-gray-900 font-medium">
                {project.createdAt?.toDate().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>

            {/* Deadline */}
            {project.deadline && (
              <View className="flex-row items-center py-3 border-b border-gray-100">
                <Text className="text-gray-600 flex-1">Deadline</Text>
                <Text className="text-gray-900 font-medium">{project.deadline}</Text>
              </View>
            )}

            {/* Status */}
            <View className="flex-row items-center py-3">
              <Text className="text-gray-600 flex-1">Status</Text>
              <Text className="text-green-500 font-medium capitalize">
                {project.status}
              </Text>
            </View>
          </View>
        )}

        {/* Project Links */}
        {activeTab === "Overview" && (project.projectLinks?.github || project.projectLinks?.website) && (
          <View className="px-6 pb-6">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              Project Links
            </Text>
            {project.projectLinks?.github && (
              <TouchableOpacity
                onPress={() => openLink(project.projectLinks.github)}
                className="flex-row items-center py-3 border-b border-gray-100"
              >
                <Feather name="github" size={20} color="#1f2937" />
                <Text className="text-gray-900 ml-3 flex-1">GitHub Repository</Text>
                <Feather name="external-link" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
            {project.projectLinks?.website && (
              <TouchableOpacity
                onPress={() => openLink(project.projectLinks.website)}
                className="flex-row items-center py-3"
              >
                <Feather name="globe" size={20} color="#1f2937" />
                <Text className="text-gray-900 ml-3 flex-1">Project Website</Text>
                <Feather name="external-link" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Similar Projects - Live from Firebase */}
        {activeTab === "Overview" && similarProjects.length > 0 && (
          <View className="px-6 pb-24">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              Similar Projects
            </Text>
            {similarProjects.map((simProject) => (
              <TouchableOpacity
                key={simProject.id}
                onPress={() => navigation.push("ProjectDetails", { projectId: simProject.id })}
                className="bg-gray-50 rounded-xl p-4 mb-3"
              >
                <Text className="text-base font-medium text-gray-900 mb-1">
                  {simProject.title}
                </Text>
                <Text className="text-sm text-gray-600">
                  {simProject.domain} • {simProject.memberCount || 1} members
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Team Tab */}
        {activeTab === "Team" && (
          <View className="px-6 py-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Team Members ({teamMembers.length})
            </Text>

            {loadingMembers ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            ) : teamMembers.length === 0 ? (
              <View className="py-12 items-center">
                <Feather name="users" size={48} color="#d1d5db" />
                <Text className="text-gray-500 mt-4">No team members yet</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {teamMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    onPress={() => navigation.navigate("Profile", { userId: member.id })}
                    className="bg-white border border-gray-200 rounded-xl p-4 mb-3"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center">
                      {/* Avatar */}
                      <View className="mr-4">
                        {member.profileImage ? (
                          <Image
                            source={{ uri: member.profileImage }}
                            className="w-14 h-14 rounded-full bg-gray-200"
                          />
                        ) : (
                          <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center">
                            <Text className="text-blue-600 font-semibold text-xl">
                              {member.name?.charAt(0)?.toUpperCase() || "?"}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Member Info */}
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Text className="text-base font-semibold text-gray-900">
                            {member.name || "Anonymous User"}
                          </Text>
                          {member.id === project.createdBy && (
                            <View className="ml-2 bg-purple-100 px-2 py-0.5 rounded-full">
                              <Text className="text-xs text-purple-700 font-medium">
                                Creator
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Branch & Year */}
                        {(member.branch || member.year) && (
                          <Text className="text-sm text-gray-600 mb-1">
                            {member.branch || "N/A"} • {member.year || "N/A"}
                          </Text>
                        )}

                        {/* Skills */}
                        {member.skills && member.skills.length > 0 && (
                          <View className="flex-row flex-wrap gap-1 mt-2">
                            {member.skills.slice(0, 3).map((skill, index) => (
                              <View
                                key={index}
                                className="bg-gray-100 px-2 py-1 rounded"
                              >
                                <Text className="text-xs text-gray-700">
                                  {skill}
                                </Text>
                              </View>
                            ))}
                            {member.skills.length > 3 && (
                              <View className="bg-gray-100 px-2 py-1 rounded">
                                <Text className="text-xs text-gray-700">
                                  +{member.skills.length - 3}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>

                      {/* Arrow Icon */}
                      <Feather name="chevron-right" size={20} color="#9ca3af" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Other Tabs Placeholder */}
        {(activeTab === "Discussion" || activeTab === "Resources") && (
          <View className="px-6 py-12 items-center">
            <Feather name="inbox" size={48} color="#d1d5db" />
            <Text className="text-gray-500 mt-4">{activeTab} coming soon</Text>
          </View>
        )}
      </ScrollView>

      {/* Join Button */}
      <View className="px-6 py-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={handleJoinProject}
          disabled={joining || isMember}
          className={`py-4 rounded-xl ${
            isMember ? "bg-gray-300" : "bg-blue-600"
          }`}
        >
          {joining ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              {isMember ? "Already a Member" : "Join Project"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProjectDetails;