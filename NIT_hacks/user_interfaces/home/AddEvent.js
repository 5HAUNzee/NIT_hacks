import React, { useState, useRef } from "react";
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
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { db } from "../../firebase.config";
import { collection, addDoc } from "firebase/firestore";
import { useUser } from "@clerk/clerk-expo";

const { width, height } = Dimensions.get("window");

const AddEvent = ({ navigation }) => {
  const { user } = useUser();
  const mapRef = useRef(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Hackathon");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [participants, setParticipants] = useState("");
  const [registrationFee, setRegistrationFee] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("Open");
  
  // Map state
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 22.2555,
    longitude: 84.9030,
  });
  const [showMap, setShowMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventTypes = ["Hackathon", "Workshop", "Conference", "Competition"];
  const statusOptions = ["Open", "Upcoming", "Closed"];

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const confirmLocation = () => {
    setShowMap(false);
    Alert.alert(
      "Location Selected",
      `Coordinates: ${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`
    );
  };

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
        organizer: organizer.trim(),
        participants: participants ? parseInt(participants) : 0,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        description: description.trim(),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        registrationFee: registrationFee.trim() || "Free",
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
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert(
        "Error", 
        error.message || "Failed to create event. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventTypeColor = (eventType) => {
    switch (eventType) {
      case "Hackathon":
        return "#3b82f6";
      case "Workshop":
        return "#10b981";
      case "Conference":
        return "#8b5cf6";
      case "Competition":
        return "#f97316";
      default:
        return "#6b7280";
    }
  };

  if (showMap) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        {/* Map Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity onPress={() => setShowMap(false)}>
              <Feather name="arrow-left" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">
              Select Event Location
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <Text className="text-sm text-gray-600 mt-2 text-center">
            Tap on the map to select location
          </Text>
        </View>

        {/* Map */}
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={styles.map}
          initialRegion={{
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          <Marker
            coordinate={selectedLocation}
            pinColor={getEventTypeColor(type)}
            draggable
            onDragEnd={(e) =>
              setSelectedLocation(e.nativeEvent.coordinate)
            }
            title="Event Location"
            description="Drag to adjust position"
          />
        </MapView>

        {/* Location Info Card */}
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <View className="mb-3">
            <Text className="text-sm text-gray-600 mb-1">Selected Coordinates</Text>
            <View className="flex-row items-center">
              <Feather name="map-pin" size={16} color="#3b82f6" />
              <Text className="text-base font-semibold text-gray-900 ml-2">
                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={confirmLocation}
            className="bg-blue-600 py-4 rounded-xl items-center"
          >
            <Text className="text-white font-bold text-base">Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-100">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">Create Event</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 py-6">
            {/* Event Title */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Event Title *
              </Text>
              <TextInput
                placeholder="e.g., HackNIT 2024"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              />
            </View>

            {/* Event Type */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Event Type *
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {eventTypes.map((eventType) => (
                  <TouchableOpacity
                    key={eventType}
                    onPress={() => setType(eventType)}
                    className={`px-4 py-2 rounded-xl ${
                      type === eventType ? "bg-blue-600" : "bg-white border border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        type === eventType ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {eventType}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date and Time */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Date *
                </Text>
                <TextInput
                  placeholder="Dec 15-17, 2024"
                  placeholderTextColor="#9ca3af"
                  value={date}
                  onChangeText={setDate}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Time *
                </Text>
                <TextInput
                  placeholder="9:00 AM"
                  placeholderTextColor="#9ca3af"
                  value={time}
                  onChangeText={setTime}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                />
              </View>
            </View>

            {/* Location Name */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Location Name *
              </Text>
              <TextInput
                placeholder="NIT Rourkela, Main Auditorium"
                placeholderTextColor="#9ca3af"
                value={location}
                onChangeText={setLocation}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              />
            </View>

            {/* Map Location Picker */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Location on Map *
              </Text>
              <TouchableOpacity
                onPress={() => setShowMap(true)}
                className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center"
              >
                <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center">
                  <Feather name="map-pin" size={20} color="#3b82f6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-semibold text-gray-900">
                    Select Location on Map
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Lat: {selectedLocation.latitude.toFixed(4)}, Lng:{" "}
                    {selectedLocation.longitude.toFixed(4)}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Description *
              </Text>
              <TextInput
                placeholder="Describe your event in detail..."
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              />
            </View>

            {/* Organizer */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Organizer *
              </Text>
              <TextInput
                placeholder="Technical Society"
                placeholderTextColor="#9ca3af"
                value={organizer}
                onChangeText={setOrganizer}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              />
            </View>

            {/* Expected Participants and Fee */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Expected Participants
                </Text>
                <TextInput
                  placeholder="100"
                  placeholderTextColor="#9ca3af"
                  value={participants}
                  onChangeText={setParticipants}
                  keyboardType="numeric"
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Registration Fee
                </Text>
                <TextInput
                  placeholder="Free or ₹100"
                  placeholderTextColor="#9ca3af"
                  value={registrationFee}
                  onChangeText={setRegistrationFee}
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                />
              </View>
            </View>

            {/* Tags */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Tags (comma separated)
              </Text>
              <TextInput
                placeholder="Coding, Innovation, Prizes"
                placeholderTextColor="#9ca3af"
                value={tags}
                onChangeText={setTags}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              />
            </View>

            {/* Status */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Status
              </Text>
              <View className="flex-row gap-2">
                {statusOptions.map((statusOption) => (
                  <TouchableOpacity
                    key={statusOption}
                    onPress={() => setStatus(statusOption)}
                    className={`px-4 py-2 rounded-xl ${
                      status === statusOption
                        ? "bg-green-600"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        status === statusOption ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {statusOption}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`py-4 rounded-xl items-center ${
                isSubmitting ? "bg-gray-400" : "bg-blue-600"
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-bold text-base">Create Event</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default AddEvent;
