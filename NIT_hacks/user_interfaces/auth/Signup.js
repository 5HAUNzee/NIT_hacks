import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useSignUp } from "@clerk/clerk-expo";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase.config";

// Sample data for dropdowns
const COLLEGES = [
  "NIT Trichy",
  "NIT Warangal",
  "NIT Surathkal",
  "NIT Calicut",
  "NIT Rourkela",
  "IIT Delhi",
  "IIT Bombay",
  "IIT Madras",
  "IIT Kanpur",
  "IIIT Hyderabad",
  "BITS Pilani",
  "VIT Vellore",
  "Other",
];

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Artificial Intelligence",
  "Data Science",
  "Other",
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Alumni"];

const SignUp = ({ navigation }) => {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  
  // Dropdown states
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);

  // ✅ CREATE USER IN FIRESTORE
  const createUserInFirestore = async (userId, userData) => {
    try {
      console.log("📝 Creating user in Firestore with ID:", userId);

      if (!db) {
        throw new Error("Firebase database not initialized");
      }

      const userRef = doc(db, "users", userId);

      const firestoreData = {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        username: userData.username || "",
        githubLink: userData.githubLink || "",
        college: userData.college || "",
        department: userData.department || "",
        year: userData.year || "",
        profilePic: userData.profilePic || null,
        profileCompleted: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(userRef, firestoreData);

      console.log("✅ User successfully created in Firestore");
      return true;
    } catch (error) {
      console.error("❌ Firestore Error:", error.message);
      throw error;
    }
  };

  // ✅ HANDLE SIGNUP
  const handleSignUp = async () => {
    if (!firstName.trim()) {
      Alert.alert("Error", "Please enter your first name");
      return;
    }
    if (!lastName.trim()) {
      Alert.alert("Error", "Please enter your last name");
      return;
    }
    if (!username.trim()) {
      Alert.alert("Error", "Please enter a username");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    if (!college.trim()) {
      Alert.alert("Error", "Please select your college");
      return;
    }
    if (!department.trim()) {
      Alert.alert("Error", "Please select your department");
      return;
    }
    if (!year.trim()) {
      Alert.alert("Error", "Please select your year");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter a password");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    if (!isLoaded) {
      Alert.alert("Error", "Sign up is not ready. Please try again.");
      return;
    }

    setLoading(true);
    try {
      console.log("🔄 Starting signup process...");

      await signUp.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        emailAddress: email.trim(),
        password,
      });

      console.log("✅ Signup created");
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setVerifying(true);
      console.log("📧 Email verification prepared");

      Alert.alert(
        "Verification Code Sent",
        `Check your email (${email}) for the 6-digit code.`
      );
    } catch (err) {
      console.error("❌ SignUp Error:", err.message || err);
      Alert.alert(
        "SignUp Error",
        err.errors?.[0]?.message || "Please try again"
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ HANDLE EMAIL VERIFICATION
  const handleVerifyEmail = async () => {
    if (!code || code.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      console.log("🔐 Verifying email code...");

      const result = await signUp.attemptEmailAddressVerification({ code });

      console.log("✅ Verification status:", result.status);

      if (result.status === "complete") {
        console.log("🎉 Verification complete!");
        console.log("👤 User ID:", result.createdUserId);

        await setActive({ session: result.createdSessionId });
        console.log("✅ Session activated");

        const userId = result.createdUserId;
        const userData = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          username: username.trim(),
          githubLink: githubLink.trim(),
          college: college.trim(),
          department: department.trim(),
          year: year.trim(),
          profilePic: null,
        };

        console.log("💾 Saving to Firestore...");
        await createUserInFirestore(userId, userData);

        setVerifying(false);
        setCode("");
        setLoading(false);

        console.log("🚀 Navigating to HomeDashboard...");
        navigation.replace("HomeDashboard");
      } else {
        Alert.alert("Error", "Verification incomplete. Please try again.");
      }
    } catch (err) {
      console.error("❌ Verification Error:", err.message || err);
      Alert.alert("Error", err.errors?.[0]?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ VERIFICATION SCREEN
  if (verifying) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.verifyContainer}
        >
          <View style={styles.verifyContent}>
            <View style={styles.verifyIconContainer}>
              <Feather name="mail" size={40} color="#3b82f6" />
            </View>

            <Text style={styles.verifyTitle}>Verify Email</Text>
            <Text style={styles.verifySubtitle}>
              We sent a 6-digit code to
            </Text>
            <Text style={styles.verifyEmail}>{email}</Text>
          </View>

          <View style={styles.verifyInputSection}>
            <Text style={styles.inputLabel}>Verification Code</Text>
            <TextInput
              placeholder="000000"
              placeholderTextColor="#9ca3af"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              style={styles.verifyInput}
            />
          </View>

          <TouchableOpacity
            onPress={handleVerifyEmail}
            disabled={loading}
            activeOpacity={0.8}
            style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <Feather name="check-circle" size={20} color="white" />
                <Text style={styles.verifyButtonText}>Verify Email</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setVerifying(false)}
            disabled={loading}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to SignUp</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Dropdown component
  const DropdownModal = ({ visible, onClose, title, options, onSelect, icon }) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <Feather name={icon} size={20} color="#3b82f6" />
              <Text style={styles.modalTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalOption}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text style={styles.modalOptionText}>{option}</Text>
                <Feather name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ✅ MAIN SIGNUP SCREEN
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              disabled={loading}
            >
              <Feather name="arrow-left" size={24} color="#1f2937" />
            </TouchableOpacity>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Welcome! Please fill in all details to get started.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {/* Name Row */}
            <View style={styles.nameRow}>
              <View style={styles.nameInput}>
                <View style={styles.labelRow}>
                  <Feather name="user" size={16} color="#3b82f6" />
                  <Text style={styles.inputLabel}>First Name</Text>
                </View>
                <View style={styles.inputCard}>
                  <TextInput
                    placeholder="First name"
                    placeholderTextColor="#9ca3af"
                    value={firstName}
                    onChangeText={setFirstName}
                    editable={!loading}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.nameInput}>
                <View style={styles.labelRow}>
                  <Feather name="user" size={16} color="#3b82f6" />
                  <Text style={styles.inputLabel}>Last Name</Text>
                </View>
                <View style={styles.inputCard}>
                  <TextInput
                    placeholder="Last name"
                    placeholderTextColor="#9ca3af"
                    value={lastName}
                    onChangeText={setLastName}
                    editable={!loading}
                    style={styles.input}
                  />
                </View>
              </View>
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Feather name="at-sign" size={18} color="#3b82f6" />
                <Text style={styles.inputLabel}>Username</Text>
              </View>
              <View style={styles.inputCard}>
                <TextInput
                  placeholder="Enter username"
                  placeholderTextColor="#9ca3af"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  editable={!loading}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Feather name="mail" size={18} color="#3b82f6" />
                <Text style={styles.inputLabel}>Email Address</Text>
              </View>
              <View style={styles.inputCard}>
                <TextInput
                  placeholder="name@example.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  style={styles.input}
                />
              </View>
            </View>

            {/* College Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Feather name="book" size={18} color="#3b82f6" />
                <Text style={styles.inputLabel}>College *</Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownCard}
                onPress={() => setShowCollegeModal(true)}
                disabled={loading}
              >
                <Text style={[styles.dropdownText, !college && styles.dropdownPlaceholder]}>
                  {college || "Select your college"}
                </Text>
                <Feather name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Department Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Feather name="briefcase" size={18} color="#3b82f6" />
                <Text style={styles.inputLabel}>Department *</Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownCard}
                onPress={() => setShowDepartmentModal(true)}
                disabled={loading}
              >
                <Text style={[styles.dropdownText, !department && styles.dropdownPlaceholder]}>
                  {department || "Select your department"}
                </Text>
                <Feather name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Year Dropdown */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Feather name="calendar" size={18} color="#3b82f6" />
                <Text style={styles.inputLabel}>Year *</Text>
              </View>
              <TouchableOpacity
                style={styles.dropdownCard}
                onPress={() => setShowYearModal(true)}
                disabled={loading}
              >
                <Text style={[styles.dropdownText, !year && styles.dropdownPlaceholder]}>
                  {year || "Select your year"}
                </Text>
                <Feather name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* GitHub Link */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Feather name="github" size={18} color="#3b82f6" />
                <Text style={styles.inputLabel}>GitHub Profile</Text>
              </View>
              <View style={styles.inputCard}>
                <TextInput
                  placeholder="https://github.com/yourusername"
                  placeholderTextColor="#9ca3af"
                  value={githubLink}
                  onChangeText={setGithubLink}
                  autoCapitalize="none"
                  editable={!loading}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Feather name="lock" size={18} color="#3b82f6" />
                <Text style={styles.inputLabel}>Password</Text>
              </View>
              <View style={[styles.inputCard, { flexDirection: 'row', alignItems: 'center' }]}>
                <TextInput
                  placeholder="Minimum 8 characters"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  style={[styles.input, { flex: 1 }]}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  disabled={loading}
                >
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={18}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Create Account Button */}
            <TouchableOpacity
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Feather name="user-plus" size={20} color="white" />
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.signInRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                disabled={loading}
              >
                <Text style={styles.signInLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dropdown Modals */}
      <DropdownModal
        visible={showCollegeModal}
        onClose={() => setShowCollegeModal(false)}
        title="Select College"
        options={COLLEGES}
        onSelect={setCollege}
        icon="book"
      />
      <DropdownModal
        visible={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        title="Select Department"
        options={DEPARTMENTS}
        onSelect={setDepartment}
        icon="briefcase"
      />
      <DropdownModal
        visible={showYearModal}
        onClose={() => setShowYearModal(false)}
        title="Select Year"
        options={YEARS}
        onSelect={setYear}
        icon="calendar"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerSection: {
    marginBottom: 32,
  },
  backBtn: {
    marginBottom: 20,
    width: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
  },
  formSection: {
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  nameInput: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 8,
  },
  inputCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    fontSize: 16,
    color: "#1f2937",
  },
  dropdownCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownText: {
    fontSize: 16,
    color: "#1f2937",
  },
  dropdownPlaceholder: {
    color: "#9ca3af",
  },
  eyeButton: {
    padding: 4,
  },
  signUpButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  signUpButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  footer: {
    alignItems: "center",
    marginTop: 8,
  },
  signInRow: {
    flexDirection: "row",
  },
  footerText: {
    color: "#6b7280",
    fontSize: 14,
  },
  signInLink: {
    color: "#3b82f6",
    fontWeight: "700",
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginLeft: 8,
  },
  modalScroll: {
    maxHeight: "100%",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#1f2937",
  },
  // Verification styles
  verifyContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  verifyContent: {
    alignItems: "center",
    marginBottom: 32,
  },
  verifyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#3b82f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  verifyTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  verifySubtitle: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 4,
  },
  verifyEmail: {
    fontSize: 15,
    color: "#3b82f6",
    fontWeight: "600",
  },
  verifyInputSection: {
    marginBottom: 24,
  },
  verifyInput: {
    backgroundColor: "#fff",
    color: "#1f2937",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 8,
    fontWeight: "600",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  verifyButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowOpacity: 0,
  },
  verifyButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  backButton: {
    alignItems: "center",
  },
  backButtonText: {
    color: "#3b82f6",
    fontWeight: "600",
    fontSize: 15,
  },
});

export default SignUp;
