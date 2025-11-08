import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase.config";
import { useUser } from "@clerk/clerk-expo";

const CreateProject = ({ navigation }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  // Form states
  const [projectTitle, setProjectTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [maxTeamSize, setMaxTeamSize] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [roles, setRoles] = useState([{ title: "", count: "" }]);
  const [githubRepo, setGithubRepo] = useState("");
  const [projectWebsite, setProjectWebsite] = useState("");

  const [showDomainDropdown, setShowDomainDropdown] = useState(false);

  const skillOptions = [
    "React",
    "Python",
    "Java",
    "Machine Learning",
    "UI/UX",
    "Data Science",
    "Mobile Dev",
    "Cloud",
    "DevOps",
    "Blockchain",
  ];

  const domainOptions = [
    "Web Development",
    "Mobile Development",
    "Machine Learning",
    "Data Science",
    "Blockchain",
    "IoT",
    "Cybersecurity",
    "Game Development",
    "Cloud Computing",
    "DevOps",
  ];

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addRole = () => {
    setRoles([...roles, { title: "", count: "" }]);
  };

  const updateRole = (index, field, value) => {
    const updatedRoles = [...roles];
    updatedRoles[index][field] = value;
    setRoles(updatedRoles);
  };

  const removeRole = (index) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const handleCreateProject = async () => {
    // Validation
    if (!projectTitle.trim()) {
      Alert.alert("Error", "Please enter project title");
      return;
    }
    if (!shortDescription.trim()) {
      Alert.alert("Error", "Please enter short description");
      return;
    }
    if (!fullDescription.trim()) {
      Alert.alert("Error", "Please enter full description");
      return;
    }
    if (!domain) {
      Alert.alert("Error", "Please select a domain");
      return;
    }
    if (!maxTeamSize || isNaN(maxTeamSize)) {
      Alert.alert("Error", "Please enter valid max team size");
      return;
    }
    if (selectedSkills.length === 0) {
      Alert.alert("Error", "Please select at least one skill");
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        title: projectTitle.trim(),
        shortDescription: shortDescription.trim(),
        fullDescription: fullDescription.trim(),
        domain,
        maxTeamSize: parseInt(maxTeamSize),
        deadline: deadline || null,
        requiredSkills: selectedSkills,
        openRoles: roles.filter((role) => role.title.trim() !== ""),
        projectLinks: {
          github: githubRepo.trim() || null,
          website: projectWebsite.trim() || null,
        },
        createdBy: user.id,
        creatorName: `${user.firstName} ${user.lastName}`,
        creatorEmail: user.primaryEmailAddress.emailAddress,
        currentMembers: [user.id],
        memberCount: 1,
        status: "open",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, "projects"), projectData);
      console.log("✅ Project created:", docRef.id);

      Alert.alert("Success", "Project created successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("❌ Error creating project:", error);
      Alert.alert("Error", "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-sm text-gray-500">Back to Projects</Text>
          <Text className="text-xl font-semibold text-gray-900">
            Create New Project
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <Text className="text-sm text-gray-600 mb-6">
            Share your idea and build an amazing team
          </Text>

          {/* Basic Information */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              Basic Information
            </Text>

            {/* Project Title */}
            <View className="mb-4">
              <Text className="text-sm text-gray-700 mb-2">
                Project Title <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                placeholder="e.g., AI-Powered Study Assistant"
                placeholderTextColor="#9ca3af"
                value={projectTitle}
                onChangeText={setProjectTitle}
                className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200"
              />
            </View>

            {/* Short Description */}
            <View className="mb-4">
              <Text className="text-sm text-gray-700 mb-2">
                Short Description <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                placeholder="Brief one-line description"
                placeholderTextColor="#9ca3af"
                value={shortDescription}
                onChangeText={setShortDescription}
                className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200"
              />
            </View>

            {/* Full Description */}
            <View className="mb-4">
              <Text className="text-sm text-gray-700 mb-2">
                Full Description <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                placeholder="Describe your project in detail..."
                placeholderTextColor="#9ca3af"
                value={fullDescription}
                onChangeText={setFullDescription}
                multiline
                numberOfLines={6}
                className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200"
                style={{ textAlignVertical: "top" }}
              />
            </View>

            {/* Domain */}
            <View className="mb-4">
              <Text className="text-sm text-gray-700 mb-2">
                Domain <Text className="text-red-500">*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setShowDomainDropdown(!showDomainDropdown)}
                className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 flex-row justify-between items-center"
              >
                <Text className={domain ? "text-gray-900" : "text-gray-400"}>
                  {domain || "Select domain"}
                </Text>
                <Feather
                  name={showDomainDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
              {showDomainDropdown && (
                <View className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {domainOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => {
                        setDomain(option);
                        setShowDomainDropdown(false);
                      }}
                      className="px-4 py-3 border-b border-gray-100"
                    >
                      <Text className="text-gray-900">{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Max Team Size */}
            <View className="mb-4">
              <Text className="text-sm text-gray-700 mb-2">
                Max Team Size <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                placeholder="8"
                placeholderTextColor="#9ca3af"
                value={maxTeamSize}
                onChangeText={setMaxTeamSize}
                keyboardType="number-pad"
                className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200"
              />
            </View>

            {/* Project Deadline */}
            <View className="mb-4">
              <Text className="text-sm text-gray-700 mb-2">Project Deadline</Text>
              <TextInput
                placeholder="dd-mm-yyyy"
                placeholderTextColor="#9ca3af"
                value={deadline}
                onChangeText={setDeadline}
                className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200"
              />
            </View>
          </View>

          {/* Required Skills */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Required Skills <Text className="text-red-500">*</Text>
            </Text>
            <Text className="text-sm text-gray-600 mb-4">
              Select the skills needed for this project
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {skillOptions.map((skill) => (
                <TouchableOpacity
                  key={skill}
                  onPress={() => toggleSkill(skill)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedSkills.includes(skill)
                      ? "bg-blue-50 border-blue-500"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Text
                    className={
                      selectedSkills.includes(skill)
                        ? "text-blue-600"
                        : "text-gray-700"
                    }
                  >
                    {skill}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Open Roles */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-semibold text-gray-900">Open Roles</Text>
              <TouchableOpacity
                onPress={addRole}
                className="flex-row items-center bg-blue-50 px-3 py-2 rounded-lg"
              >
                <Feather name="plus" size={16} color="#3b82f6" />
                <Text className="text-blue-600 ml-2 font-medium">Add Role</Text>
              </TouchableOpacity>
            </View>

            {roles.map((role, index) => (
              <View key={index} className="mb-4 bg-gray-50 p-4 rounded-xl">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm font-medium text-gray-700">
                    Role {index + 1}
                  </Text>
                  {roles.length > 1 && (
                    <TouchableOpacity onPress={() => removeRole(index)}>
                      <Feather name="trash-2" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  placeholder="e.g., Frontend Developer"
                  placeholderTextColor="#9ca3af"
                  value={role.title}
                  onChangeText={(text) => updateRole(index, "title", text)}
                  className="bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-200 mb-3"
                />
                <TextInput
                  placeholder="Number of positions"
                  placeholderTextColor="#9ca3af"
                  value={role.count}
                  onChangeText={(text) => updateRole(index, "count", text)}
                  keyboardType="number-pad"
                  className="bg-white text-gray-900 px-4 py-3 rounded-lg border border-gray-200"
                />
              </View>
            ))}
          </View>

          {/* Project Links */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              Project Links (Optional)
            </Text>

            <View className="mb-4">
              <Text className="text-sm text-gray-700 mb-2">GitHub Repository</Text>
              <TextInput
                placeholder="https://github.com/username/repo"
                placeholderTextColor="#9ca3af"
                value={githubRepo}
                onChangeText={setGithubRepo}
                autoCapitalize="none"
                className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200"
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-700 mb-2">Project Website</Text>
              <TextInput
                placeholder="https://yourproject.com"
                placeholderTextColor="#9ca3af"
                value={projectWebsite}
                onChangeText={setProjectWebsite}
                autoCapitalize="none"
                className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200"
              />
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3 mb-8">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={loading}
              className="flex-1 py-4 bg-gray-200 rounded-xl"
            >
              <Text className="text-gray-700 text-center font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCreateProject}
              disabled={loading}
              className="flex-1 py-4 bg-blue-600 rounded-xl"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white text-center font-semibold">
                  Create Project
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateProject;
