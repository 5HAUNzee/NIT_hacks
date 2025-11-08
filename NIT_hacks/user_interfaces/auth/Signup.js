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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSignUp } from "@clerk/clerk-expo";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase.config";

const SignUp = ({ navigation }) => {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  // ✅ CREATE USER IN FIRESTORE
  const createUserInFirestore = async (userId, userData) => {
    try {
      console.log("📝 Creating user in Firestore with ID:", userId);

      if (!db) {
        throw new Error("Firebase database not initialized");
      }

      // This will create the 'users' collection if it doesn't exist
      const userRef = doc(db, "users", userId);

      const firestoreData = {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        username: userData.username || "",
        githubLink: userData.githubLink || "",
        profilePic: userData.profilePic || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // setDoc automatically creates collection if it doesn't exist
      await setDoc(userRef, firestoreData);

      console.log("✅ User successfully created in Firestore");
      console.log("✅ Collection 'users' created (if it didn't exist)");
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
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
        <LinearGradient
          colors={["#0f172a", "#1e293b", "#0f172a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}
          >
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 24,
                  borderWidth: 2,
                  borderColor: "rgba(59, 130, 246, 0.3)",
                }}
              >
                <Feather name="mail" size={36} color="#3b82f6" />
              </View>

              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "700",
                  color: "#fff",
                  marginBottom: 8,
                }}
              >
                Verify Email
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: "#94a3b8",
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                We sent a 6-digit code to
              </Text>
              <Text
                style={{ fontSize: 15, color: "#3b82f6", fontWeight: "600" }}
              >
                {email}
              </Text>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: "#e2e8f0",
                  fontWeight: "600",
                  marginBottom: 10,
                  fontSize: 14,
                }}
              >
                Verification Code
              </Text>
              <TextInput
                placeholder="000000"
                placeholderTextColor="#475569"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                style={{
                  backgroundColor: "#1e293b",
                  color: "#fff",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  fontSize: 24,
                  textAlign: "center",
                  letterSpacing: 8,
                  fontWeight: "600",
                  borderWidth: 1.5,
                  borderColor: "#334155",
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleVerifyEmail}
              disabled={loading}
              activeOpacity={0.85}
              style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16 }}
            >
              <LinearGradient
                colors={["#6366f1", "#3b82f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 14, paddingHorizontal: 24 }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "700",
                      textAlign: "center",
                      fontSize: 16,
                    }}
                  >
                    Verify Email
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setVerifying(false)}
              disabled={loading}
            >
              <Text
                style={{
                  color: "#3b82f6",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: 15,
                }}
              >
                Back to SignUp
              </Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // ✅ MAIN SIGNUP SCREEN
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <LinearGradient
        colors={["#0f172a", "#1e293b", "#0f172a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 40 }}
            >
              <View>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{ marginBottom: 24 }}
                  disabled={loading}
                >
                  <Feather name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>

                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: "700",
                    color: "#fff",
                    marginBottom: 8,
                  }}
                >
                  Create Account
                </Text>
                <Text
                  style={{ fontSize: 15, color: "#94a3b8", marginBottom: 32 }}
                >
                  Welcome! Please fill in all details to get started.
                </Text>
              </View>

              <View>
                <View
                  style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "#e2e8f0",
                        fontWeight: "600",
                        marginBottom: 10,
                        fontSize: 14,
                      }}
                    >
                      First name
                    </Text>
                    <TextInput
                      placeholder="First name"
                      placeholderTextColor="#475569"
                      value={firstName}
                      onChangeText={setFirstName}
                      editable={!loading}
                      style={{
                        backgroundColor: "#1e293b",
                        color: "#fff",
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: "#334155",
                        fontSize: 16,
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "#e2e8f0",
                        fontWeight: "600",
                        marginBottom: 10,
                        fontSize: 14,
                      }}
                    >
                      Last name
                    </Text>
                    <TextInput
                      placeholder="Last name"
                      placeholderTextColor="#475569"
                      value={lastName}
                      onChangeText={setLastName}
                      editable={!loading}
                      style={{
                        backgroundColor: "#1e293b",
                        color: "#fff",
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: "#334155",
                        fontSize: 16,
                      }}
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      color: "#e2e8f0",
                      fontWeight: "600",
                      marginBottom: 10,
                      fontSize: 14,
                    }}
                  >
                    Username
                  </Text>
                  <TextInput
                    placeholder="Enter username"
                    placeholderTextColor="#475569"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    editable={!loading}
                    style={{
                      backgroundColor: "#1e293b",
                      color: "#fff",
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: "#334155",
                      fontSize: 16,
                    }}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      color: "#e2e8f0",
                      fontWeight: "600",
                      marginBottom: 10,
                      fontSize: 14,
                    }}
                  >
                    Email address
                  </Text>
                  <TextInput
                    placeholder="name@example.com"
                    placeholderTextColor="#475569"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                    style={{
                      backgroundColor: "#1e293b",
                      color: "#fff",
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: "#334155",
                      fontSize: 16,
                    }}
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      color: "#e2e8f0",
                      fontWeight: "600",
                      marginBottom: 10,
                      fontSize: 14,
                    }}
                  >
                    GitHub Profile Link
                  </Text>
                  <TextInput
                    placeholder="https://github.com/yourusername"
                    placeholderTextColor="#475569"
                    value={githubLink}
                    onChangeText={setGithubLink}
                    autoCapitalize="none"
                    editable={!loading}
                    style={{
                      backgroundColor: "#1e293b",
                      color: "#fff",
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: "#334155",
                      fontSize: 16,
                    }}
                  />
                </View>

                <View style={{ marginBottom: 24 }}>
                  <Text
                    style={{
                      color: "#e2e8f0",
                      fontWeight: "600",
                      marginBottom: 10,
                      fontSize: 14,
                    }}
                  >
                    Password
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#1e293b",
                      borderWidth: 1.5,
                      borderColor: "#334155",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                    }}
                  >
                    <TextInput
                      placeholder="Minimum 8 characters"
                      placeholderTextColor="#475569"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                      style={{ flex: 1, color: "#fff", fontSize: 16 }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={{ padding: 8 }}
                      disabled={loading}
                    >
                      <Feather
                        name={showPassword ? "eye" : "eye-off"}
                        size={18}
                        color="#64748b"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSignUp}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    marginBottom: 24,
                  }}
                >
                  <LinearGradient
                    colors={["#6366f1", "#3b82f6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ paddingVertical: 14, paddingHorizontal: 24 }}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "700",
                          textAlign: "center",
                          fontSize: 16,
                        }}
                      >
                        Continue
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "center" }}>
                <Text style={{ color: "#64748b" }}>
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Login")}
                  disabled={loading}
                >
                  <Text
                    style={{
                      color: "#3b82f6",
                      fontWeight: "700",
                      textDecorationLine: "underline",
                    }}
                  >
                    Sign in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default SignUp;
