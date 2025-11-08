import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase.config";
import { useUser } from "@clerk/clerk-expo";

const AddEvent = ({ navigation }) => {
  const { user } = useUser();

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Hackathon");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("22.2555");
  const [longitude, setLongitude] = useState("84.9030");
  const [description, setDescription] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [participants, setParticipants] = useState("");
  const [registrationFee, setRegistrationFee] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("Open");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventTypes = ["Hackathon", "Workshop", "Conference", "Competition"];
  const statusOptions = ["Open", "Upcoming", "Closed"];

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter event title");
      return false;
    }
    if (!date.trim()) {
      Alert.alert("Error", "Please enter event date");
      return false;
    }
    if (!time.trim()) {
      Alert.alert("Error", "Please enter event time");
      return false;
    }
    if (!location.trim()) {
      Alert.alert("Error", "Please enter event location");
      return false;
    }
    if (!latitude.trim() || isNaN(parseFloat(latitude))) {
      Alert.alert("Error", "Please enter valid latitude");
      return false;
    }
    if (!longitude.trim() || isNaN(parseFloat(longitude))) {
      Alert.alert("Error", "Please enter valid longitude");
      return false;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please enter event description");
      return false;
    }
    if (!organizer.trim()) {
      Alert.alert("Error", "Please enter organizer name");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const eventData = {
        title: title.trim(),
        type,
        date: date.trim(),
        time: time.trim(),
        location: location.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        description: description.trim(),
        organizer: organizer.trim(),
        participants: participants ? parseInt(participants) : 0,
        registrationFee: registrationFee.trim() || "Free",
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        status,
        createdBy: user?.id || "anonymous",
        createdByName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Anonymous",
        createdByEmail: user?.emailAddresses?.[0]?.emailAddress || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "events"), eventData);
      console.log("Event created with ID:", docRef.id);

      Alert.alert("Success", "Event created successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create event. Please try again.");
      console.error("Error creating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: "white",
            padding: 16,
            borderBottomColor: "#e5e7eb",
            borderBottomWidth: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1f2937" }}>
            Create Event
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={{ padding: 16 }}>
          {/* Event Title */}
          <Text style={{ fontWeight: "600", marginBottom: 4 }}>Event Title *</Text>
          <TextInput
            placeholder="e.g., HackNIT 2024"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
            style={inputStyle}
          />

          {/* Event Type */}
          <Text style={{ fontWeight: "600", marginTop: 16, marginBottom: 4 }}>Event Type *</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
            {eventTypes.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setType(option)}
                style={{
                  marginRight: 8,
                  marginBottom: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  backgroundColor: type === option ? "#3b82f6" : "#f3f4f6",
                }}
              >
                <Text style={{ color: type === option ? "white" : "#4b5563", fontWeight: "600" }}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date and Time */}
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>Date *</Text>
              <TextInput
                placeholder="Dec 15-17, 2024"
                placeholderTextColor="#9ca3af"
                value={date}
                onChangeText={setDate}
                style={inputStyle}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>Time *</Text>
              <TextInput
                placeholder="9:00 AM"
                placeholderTextColor="#9ca3af"
                value={time}
                onChangeText={setTime}
                style={inputStyle}
              />
            </View>
          </View>

          {/* Location Name */}
          <Text style={{ fontWeight: "600", marginBottom: 4 }}>Location Name *</Text>
          <TextInput
            placeholder="NIT Rourkela, Main Auditorium"
            placeholderTextColor="#9ca3af"
            value={location}
            onChangeText={setLocation}
            style={inputStyle}
          />

          {/* Latitude and Longitude */}
          <View style={{ flexDirection: "row", marginBottom:16 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>Latitude *</Text>
              <TextInput
                placeholder="22.2555"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={latitude}
                onChangeText={setLatitude}
                style={inputStyle}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>Longitude *</Text>
              <TextInput
                placeholder="84.9030"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={longitude}
                onChangeText={setLongitude}
                style={inputStyle}
              />
            </View>
          </View>

          {/* Description */}
          <Text style={{ fontWeight: "600", marginBottom: 4 }}>Description *</Text>
          <TextInput
            placeholder="Describe your event in detail..."
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ ...inputStyle, height: 100 }}
          />

          {/* Organizer */}
          <Text style={{ fontWeight: "600", marginBottom: 4 }}>Organizer *</Text>
          <TextInput
            placeholder="Technical Society"
            placeholderTextColor="#9ca3af"
            value={organizer}
            onChangeText={setOrganizer}
            style={inputStyle}
          />

          {/* Participants and Fee */}
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>Expected Participants</Text>
              <TextInput
                placeholder="100"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={participants}
                onChangeText={setParticipants}
                style={inputStyle}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>Registration Fee</Text>
              <TextInput
                placeholder="Free or ₹100"
                placeholderTextColor="#9ca3af"
                value={registrationFee}
                onChangeText={setRegistrationFee}
                style={inputStyle}
              />
            </View>
          </View>

          {/* Tags */}
          <Text style={{ fontWeight: "600", marginBottom: 4 }}>Tags (comma separated)</Text>
          <TextInput
            placeholder="Coding, Innovation, Prizes"
            placeholderTextColor="#9ca3af"
            value={tags}
            onChangeText={setTags}
            style={inputStyle}
          />

          {/* Status */}
          <Text style={{ fontWeight: "600", marginBottom: 4 }}>Status</Text>
          <View style={{ flexDirection: "row", marginBottom: 30 }}>
            {statusOptions.map((statusOption) => (
              <TouchableOpacity
                key={statusOption}
                onPress={() => setStatus(statusOption)}
                style={{
                  marginRight: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  backgroundColor: status === statusOption ? "#22c55e" : "#f3f4f6",
                }}
              >
                <Text
                  style={{
                    color: status === statusOption ? "white" : "#4b5563",
                    fontWeight: "600",
                  }}
                >
                  {statusOption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={{
              backgroundColor: isSubmitting ? "#9ca3af" : "#3b82f6",
              paddingVertical: 18,
              borderRadius: 16,
              alignItems: "center",
              marginBottom: 40,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "white", fontWeight: "700", fontSize: 18 }}>
                Create Event
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const inputStyle = {
  backgroundColor: "white",
  borderColor: "#e5e7eb",
  borderWidth: 1,
  borderRadius: 12,
  padding: 14,
  marginBottom: 20,
  color: "#1f2937",
};

export default AddEvent;
