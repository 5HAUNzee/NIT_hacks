import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { useUser } from "@clerk/clerk-expo";
import { uploadImageToCloudinary } from "../../services/cloudinaryService";

const ProfileSetupModal = ({ visible, onComplete }) => {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Step 1 data
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [major, setMajor] = useState("");
  const [bio, setBio] = useState("");

  // Step 2 data
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);

  // Step 3 data
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [availability, setAvailability] = useState("full-time");

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
  ];

  const interestOptions = [
    "Web Development",
    "AI/ML",
    "Blockchain",
    "Gaming",
    "IoT",
    "Cybersecurity",
    "Design",
    "Research",
  ];

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        const localUri = result.assets[0].uri;
        setProfilePic(localUri);

        setUploadingImage(true);
        const cloudinaryUrl = await uploadImageToCloudinary(localUri);
        setProfilePicUrl(cloudinaryUrl);
        setUploadingImage(false);

        console.log("✅ Image uploaded to Cloudinary:", cloudinaryUrl);
      }
    } catch (error) {
      setUploadingImage(false);
      Alert.alert("Error", "Failed to upload image");
      console.error(error);
    }
  };

  const toggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleInterest = (interest) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!college.trim() || !year.trim() || !major.trim()) {
        Alert.alert("Error", "Please fill all required fields");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (skills.length === 0) {
        Alert.alert("Error", "Please select at least one skill");
        return;
      }
      setStep(3);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        profilePic: profilePicUrl || null,
        college,
        year,
        major,
        bio,
        skills,
        interests,
        socialLinks: {
          github,
          linkedin,
          portfolio,
        },
        availability,
        profileCompleted: true,
        updatedAt: new Date(),
      });

      console.log("✅ Profile saved successfully");
      onComplete();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView className="flex-1 bg-black">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-6 pt-8 pb-6 items-center">
            <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4">
              <Feather name="user-check" size={32} color="#fff" />
            </View>
            <Text className="text-2xl font-semibold text-white mb-2">
              Complete Your Profile
            </Text>
            <Text className="text-sm text-gray-400">Step {step} of 3</Text>
          </View>

          {/* Progress Bar */}
          <View className="px-6 mb-8">
            <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </View>
          </View>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <View className="px-6">
              {/* Upload Photo */}
              <TouchableOpacity
                onPress={pickImage}
                disabled={uploadingImage}
                className="items-center mb-8"
              >
                <View className="w-24 h-24 rounded-full bg-zinc-800 items-center justify-center border-2 border-zinc-700 mb-3">
                  {uploadingImage ? (
                    <ActivityIndicator size="large" color="#3b82f6" />
                  ) : profilePic ? (
                    <Image
                      source={{ uri: profilePic }}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <Feather name="camera" size={32} color="#666" />
                  )}
                </View>
                <Text className="text-white text-sm">
                  {uploadingImage ? "Uploading..." : "Upload Photo"}
                </Text>
                {profilePicUrl && (
                  <Text className="text-green-500 text-xs mt-1">
                    ✓ Uploaded successfully
                  </Text>
                )}
              </TouchableOpacity>

              {/* College */}
              <View className="mb-4">
                <Text className="text-white font-semibold mb-2">College</Text>
                <TextInput
                  placeholder="Your college name"
                  placeholderTextColor="#555"
                  value={college}
                  onChangeText={setCollege}
                  className="bg-zinc-900 text-white px-4 py-3 rounded-xl border border-zinc-800"
                />
              </View>

              {/* Year */}
              <View className="mb-4">
                <Text className="text-white font-semibold mb-2">Year</Text>
                <TextInput
                  placeholder="e.g., 2nd Year"
                  placeholderTextColor="#555"
                  value={year}
                  onChangeText={setYear}
                  className="bg-zinc-900 text-white px-4 py-3 rounded-xl border border-zinc-800"
                />
              </View>

              {/* Major */}
              <View className="mb-4">
                <Text className="text-white font-semibold mb-2">Major</Text>
                <TextInput
                  placeholder="e.g., Computer Science"
                  placeholderTextColor="#555"
                  value={major}
                  onChangeText={setMajor}
                  className="bg-zinc-900 text-white px-4 py-3 rounded-xl border border-zinc-800"
                />
              </View>

              {/* Bio */}
              <View className="mb-6">
                <Text className="text-white font-semibold mb-2">Bio</Text>
                <TextInput
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#555"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  className="bg-zinc-900 text-white px-4 py-3 rounded-xl border border-zinc-800"
                  style={{ textAlignVertical: "top" }}
                />
              </View>
            </View>
          )}

          {/* Step 2: Skills & Interests */}
          {step === 2 && (
            <View className="px-6">
              {/* Skills */}
              <View className="mb-8">
                <Text className="text-white font-semibold mb-3">Skills</Text>
                <Text className="text-gray-400 text-sm mb-4">
                  Select your technical skills
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {skillOptions.map((skill) => (
                    <TouchableOpacity
                      key={skill}
                      onPress={() => toggleSkill(skill)}
                      className={`px-4 py-2 rounded-full border ${
                        skills.includes(skill)
                          ? "bg-blue-600 border-blue-600"
                          : "bg-zinc-900 border-zinc-700"
                      }`}
                    >
                      <Text
                        className={
                          skills.includes(skill)
                            ? "text-white"
                            : "text-gray-400"
                        }
                      >
                        {skill}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Interests */}
              <View className="mb-6">
                <Text className="text-white font-semibold mb-3">Interests</Text>
                <Text className="text-gray-400 text-sm mb-4">
                  What are you passionate about?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {interestOptions.map((interest) => (
                    <TouchableOpacity
                      key={interest}
                      onPress={() => toggleInterest(interest)}
                      className={`px-4 py-2 rounded-full border ${
                        interests.includes(interest)
                          ? "bg-blue-600 border-blue-600"
                          : "bg-zinc-900 border-zinc-700"
                      }`}
                    >
                      <Text
                        className={
                          interests.includes(interest)
                            ? "text-white"
                            : "text-gray-400"
                        }
                      >
                        {interest}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Step 3: Social Links */}
          {step === 3 && (
            <View className="px-6">
              <Text className="text-white font-semibold mb-4">
                Social Links
              </Text>

              {/* GitHub */}
              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">GitHub</Text>
                <View className="flex-row items-center bg-zinc-900 rounded-xl border border-zinc-800 px-4">
                  <Feather name="github" size={18} color="#666" />
                  <TextInput
                    placeholder="https://github.com/username"
                    placeholderTextColor="#555"
                    value={github}
                    onChangeText={setGithub}
                    className="flex-1 text-white py-3 ml-3"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* LinkedIn */}
              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">LinkedIn</Text>
                <View className="flex-row items-center bg-zinc-900 rounded-xl border border-zinc-800 px-4">
                  <Feather name="linkedin" size={18} color="#666" />
                  <TextInput
                    placeholder="https://linkedin.com/in/username"
                    placeholderTextColor="#555"
                    value={linkedin}
                    onChangeText={setLinkedin}
                    className="flex-1 text-white py-3 ml-3"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Portfolio */}
              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">Portfolio</Text>
                <View className="flex-row items-center bg-zinc-900 rounded-xl border border-zinc-800 px-4">
                  <Feather name="globe" size={18} color="#666" />
                  <TextInput
                    placeholder="https://yourportfolio.com"
                    placeholderTextColor="#555"
                    value={portfolio}
                    onChangeText={setPortfolio}
                    className="flex-1 text-white py-3 ml-3"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Availability */}
              <View className="mb-6">
                <Text className="text-gray-400 text-sm mb-3">Availability</Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setAvailability("full-time")}
                    className={`flex-1 py-3 rounded-xl border ${
                      availability === "full-time"
                        ? "bg-blue-600 border-blue-600"
                        : "bg-zinc-900 border-zinc-700"
                    }`}
                  >
                    <Text className="text-white text-center">Full-time</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setAvailability("part-time")}
                    className={`flex-1 py-3 rounded-xl border ${
                      availability === "part-time"
                        ? "bg-blue-600 border-blue-600"
                        : "bg-zinc-900 border-zinc-700"
                    }`}
                  >
                    <Text className="text-white text-center">Part-time</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Buttons */}
          <View className="px-6 py-6 flex-row gap-3">
            {step > 1 && (
              <TouchableOpacity
                onPress={() => setStep(step - 1)}
                className="flex-1 py-4 bg-zinc-900 rounded-xl border border-zinc-700"
                disabled={loading}
              >
                <Text className="text-white text-center font-semibold">
                  Back
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={step === 3 ? handleComplete : handleNext}
              className="flex-1 py-4 bg-blue-600 rounded-xl"
              disabled={loading || uploadingImage}
            >
              <Text className="text-white text-center font-semibold">
                {loading
                  ? "Saving..."
                  : uploadingImage
                    ? "Uploading..."
                    : step === 3
                      ? "Complete Setup"
                      : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default ProfileSetupModal;
