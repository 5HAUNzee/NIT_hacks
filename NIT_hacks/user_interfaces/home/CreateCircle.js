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

const CreateCircle = ({ navigation }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  // Form states
  const [circleName, setCircleName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [meetingDay, setMeetingDay] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [maxMembers, setMaxMembers] = useState("");

  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showDayDropdown, setShowDayDropdown] = useState(false);

  const subjects = [
    "Computer Science",
    "Data Structures & Algorithms",
    "Machine Learning",
    "Web Development",
    "Mobile Development",
    "Mathematics",
    "Physics",
    "Chemistry",
  ];

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleCreateCircle = async () => {
    if (!circleName.trim()) {
      Alert.alert("Error", "Please enter circle name");
      return;
    }
    if (!subject) {
      Alert.alert("Error", "Please select a subject");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please enter description");
      return;
    }

    setLoading(true);
    try {
      const circleData = {
        name: circleName.trim(),
        subject,
        description: description.trim(),
        tags,
        frequency: "Weekly",
        meetingDay: meetingDay || null,
        meetingTime: meetingTime || null,
        maxMembers: parseInt(maxMembers) || 50,
        members: [user.id],
        memberCount: 1,
        createdBy: user.id,
        creatorName: `${user.firstName} ${user.lastName}`,
        status: "active",
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "studyCircles"), circleData);
      Alert.alert("Success", "Study circle created successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error creating circle:", error);
      Alert.alert("Error", "Failed to create circle");
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
        <View>
          <Text className="text-xs text-gray-500 mb-1">Back to Study Circles</Text>
          <Text className="text-xl font-semibold text-gray-900">
            Create Study Circle
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-4">
          <Text className="text-sm text-gray-600 mb-6">
            Build a collaborative learning community around shared academic interests
          </Text>

          {/* Basic Information */}
          <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              Basic Information
            </Text>

            {/* Circle Name */}
            <View className="mb-4">
              <Text className="text-sm text-gray-700 mb-2">
                Circle Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                placeholder="e.g., Advanced Algorithms Study Group"
                placeholderTextColor="#9ca3af"
                value={circleName}
                onChangeText={setCircleName}
                className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200"
              />
            </View>

            {/* Subject */}
            <View className="mb-4">
              <Text className="text-sm text-gray-700 mb-2">
                Subject <Text className="text-red-500">*</Text>
              </Text>
              <TouchableOpacity
                onPress={() => setShowSubjectDropdown(!showSubjectDropdown)}
                className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 flex-row justify-between items-center"
              >
                <Text className={subject ? "text-gray-900" : "text-gray-400"}>
                  {subject || "Select subject area"}
                </Text>
                <Feather
                  name={showSubjectDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
              {showSubjectDropdown && (
                <View className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {subjects.map((subj) => (
                    <TouchableOpacity
                      key={subj}
                      onPress={() => {
                        setSubject(subj);
                        setShowSubjectDropdown(false);
                      }}
                      className="px-4 py-3 border-b border-gray-100"
                    >
                      <Text className="text-gray-900">{subj}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm text-gray-700 mb-2">
                Description <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                placeholder="Describe what your study circle is about, learning goals, and what members can expect..."
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200"
                style={{ textAlignVertical: "top" }}
              />
            </View>

            {/* Tags */}
            <View>
              <Text className="text-sm text-gray-700 mb-2">Tags</Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 mb-2">
                <TextInput
                  placeholder="Add tags (e.g., algorithms, leetcode)"
                  placeholderTextColor="#9ca3af"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                  className="flex-1 text-gray-900"
                />
                <TouchableOpacity onPress={addTag} className="ml-2">
                  <Feather name="plus" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              {tags.length > 0 && (
                <View className="flex-row flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <View
                      key={index}
                      className="bg-blue-50 px-3 py-1 rounded-full flex-row items-center"
                    >
                      <Text className="text-blue-700 text-sm mr-2">{tag}</Text>
                      <TouchableOpacity onPress={() => removeTag(tag)}>
                        <Feather name="x" size={14} color="#3b82f6" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Meeting Schedule */}
          <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <View className="flex-row items-center mb-4">
              <Feather name="calendar" size={18} color="#3b82f6" />
              <Text className="text-base font-semibold text-gray-900 ml-2">
                Meeting Schedule
              </Text>
            </View>

            <Text className="text-sm text-gray-600 mb-4">
              Frequency: <Text className="font-semibold">Weekly</Text>
            </Text>

            {/* Meeting Day */}
            <View className="mb-4">
              <Text className="text-sm text-gray-700 mb-2">Meeting Day</Text>
              <TouchableOpacity
                onPress={() => setShowDayDropdown(!showDayDropdown)}
                className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 flex-row justify-between items-center"
              >
                <Text className={meetingDay ? "text-gray-900" : "text-gray-400"}>
                  {meetingDay || "Select day"}
                </Text>
                <Feather
                  name={showDayDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
              {showDayDropdown && (
                <View className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => {
                        setMeetingDay(day);
                        setShowDayDropdown(false);
                      }}
                      className="px-4 py-3 border-b border-gray-100"
                    >
                      <Text className="text-gray-900">{day}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Meeting Time */}
            <View>
              <Text className="text-sm text-gray-700 mb-2">Meeting Time</Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
                <TextInput
                  placeholder="--:--"
                  placeholderTextColor="#9ca3af"
                  value={meetingTime}
                  onChangeText={setMeetingTime}
                  className="flex-1 text-gray-900"
                />
                <Feather name="clock" size={18} color="#6b7280" />
              </View>
            </View>
          </View>

          {/* Member Limit */}
          <View className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <View className="flex-row items-center mb-2">
              <Feather name="users" size={18} color="#3b82f6" />
              <Text className="text-base font-semibold text-gray-900 ml-2">
                Member Limit
              </Text>
            </View>
            <Text className="text-sm text-gray-600 mb-3">
              Set the maximum number of members for your circle
            </Text>
            <TextInput
              placeholder="Maximum Members"
              placeholderTextColor="#9ca3af"
              value={maxMembers}
              onChangeText={setMaxMembers}
              keyboardType="number-pad"
              className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200"
            />
          </View>

          {/* Tips for Success */}
          <View className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              Tips for Success
            </Text>
            <View className="gap-2">
              <Text className="text-sm text-gray-700">
                • Choose a descriptive name that clearly identifies your focus
              </Text>
              <Text className="text-sm text-gray-700">
                • Set clear learning goals in your description
              </Text>
              <Text className="text-sm text-blue-600">
                • Add relevant tags to help others discover your circle
              </Text>
              <Text className="text-sm text-gray-700">
                • Maintain consistent meeting schedules
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3 mb-8">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={loading}
              className="flex-1 py-4 bg-white border border-gray-300 rounded-xl"
            >
              <Text className="text-gray-700 text-center font-semibold">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCreateCircle}
              disabled={loading}
              className="flex-1 py-4 bg-blue-600 rounded-xl"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white text-center font-semibold">
                  Create Study Circle
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateCircle;
