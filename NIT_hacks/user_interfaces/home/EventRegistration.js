import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase.config";

const EventRegistration = ({ route, navigation }) => {
  const { event } = route.params;
  const { user } = useUser();

  const [formData, setFormData] = useState({
    name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    email: user?.primaryEmailAddress?.emailAddress || "",
    phone: "",
    college: "",
    year: "",
    branch: "",
    teamName: "",
    reason: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return false;
    }
    if (!formData.college.trim()) {
      Alert.alert("Error", "Please enter your college name");
      return false;
    }
    return true;
  };

  const handleRegistration = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Check if already registered
      const userRegistrationRef = doc(
        db,
        "users",
        user.id,
        "eventRegistrations",
        event.id
      );
      const existingRegistration = await getDoc(userRegistrationRef);
      
      if (existingRegistration.exists()) {
        Alert.alert("Already Registered", "You have already registered for this event!");
        setSubmitting(false);
        return;
      }

      // Create registration document
      const registrationData = {
        userId: user.id,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventType: event.type,
        ...formData,
        registeredAt: new Date().toISOString(),
        status: "confirmed",
      };

      // Save to user's registrations subcollection
      await setDoc(userRegistrationRef, registrationData);

      // Update event's participants array
      const eventRef = doc(db, "events", event.id);
      const eventSnap = await getDoc(eventRef);
      
      if (eventSnap.exists()) {
        const currentParticipants = eventSnap.data().participants || 0;
        await updateDoc(eventRef, {
          registeredUsers: arrayUnion(user.id),
          participants: currentParticipants + 1,
        });
      }

      Alert.alert(
        "Success!",
        "You have successfully registered for the event!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("Error registering for event:", error);
      Alert.alert("Error", "Failed to register. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Event Registration</Text>
          <Text style={styles.headerSubtitle}>{event.title}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Event Info Card */}
        <View style={styles.eventInfoCard}>
          <View style={styles.eventInfoRow}>
            <Feather name="calendar" size={18} color="#3b82f6" />
            <Text style={styles.eventInfoText}>{event.date}</Text>
          </View>
          <View style={styles.eventInfoRow}>
            <Feather name="clock" size={18} color="#3b82f6" />
            <Text style={styles.eventInfoText}>{event.time}</Text>
          </View>
          <View style={styles.eventInfoRow}>
            <Feather name="map-pin" size={18} color="#3b82f6" />
            <Text style={styles.eventInfoText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
          <View style={styles.eventInfoRow}>
            <Feather name="dollar-sign" size={18} color="#3b82f6" />
            <Text style={styles.eventInfoText}>{event.registrationFee}</Text>
          </View>
        </View>

        {/* Registration Form */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#9ca3af"
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              value={formData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Phone Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#9ca3af"
              value={formData.phone}
              onChangeText={(value) => handleInputChange("phone", value)}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.sectionTitle}>Academic Details</Text>

          {/* College */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              College/University <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your college name"
              placeholderTextColor="#9ca3af"
              value={formData.college}
              onChangeText={(value) => handleInputChange("college", value)}
            />
          </View>

          {/* Year and Branch */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Year</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2nd"
                placeholderTextColor="#9ca3af"
                value={formData.year}
                onChangeText={(value) => handleInputChange("year", value)}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Branch</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., CSE"
                placeholderTextColor="#9ca3af"
                value={formData.branch}
                onChangeText={(value) => handleInputChange("branch", value)}
              />
            </View>
          </View>

          {/* Conditional: Team Name for Hackathons/Competitions */}
          {(event.type === "Hackathon" || event.type === "Competition") && (
            <>
              <Text style={styles.sectionTitle}>Team Details (Optional)</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Team Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your team name (if any)"
                  placeholderTextColor="#9ca3af"
                  value={formData.teamName}
                  onChangeText={(value) => handleInputChange("teamName", value)}
                />
              </View>
            </>
          )}

          {/* Reason for Attending */}
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Why do you want to attend?</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us why you're interested in this event..."
              placeholderTextColor="#9ca3af"
              value={formData.reason}
              onChangeText={(value) => handleInputChange("reason", value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Terms and Conditions */}
          <View style={styles.termsContainer}>
            <Feather name="info" size={16} color="#6b7280" />
            <Text style={styles.termsText}>
              By registering, you agree to attend the event and follow all guidelines.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Fixed Button */}
      <View style={styles.bottomContainer}>
        <View style={styles.feeInfo}>
          <Text style={styles.feeLabel}>Registration Fee</Text>
          <Text style={styles.feeAmount}>{event.registrationFee}</Text>
        </View>
        <TouchableOpacity
          style={[styles.registerButton, submitting && styles.registerButtonDisabled]}
          onPress={handleRegistration}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.registerButtonText}>Complete Registration</Text>
              <Feather name="check-circle" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  eventInfoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  eventInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  eventInfoText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 12,
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1f2937",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  rowInputs: {
    flexDirection: "row",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 100,
  },
  termsText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  feeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  feeLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  registerButton: {
    flexDirection: "row",
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
});

export default EventRegistration;
