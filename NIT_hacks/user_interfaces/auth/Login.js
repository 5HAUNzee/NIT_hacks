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
import { useSignIn } from "@clerk/clerk-expo";
import { query, where, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase.config";

const Login = ({ navigation }) => {
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    if (!isLoaded) {
      Alert.alert("Error", "Sign in is not ready. Please try again.");
      return;
    }

    setLoading(true);
    try {
      // Sign in with Clerk
      const completeSignIn = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (completeSignIn.createdSessionId) {
        await setActive({ session: completeSignIn.createdSessionId });

        // Verify user exists in Firebase
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email.trim()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          console.log("User found in Firebase:", userData);

          // Check user status
          if (userData.status === "rejected") {
            Alert.alert("Access Denied", "Your account has been rejected. Please contact support.");
            navigation.replace("Login");
          } else if (userData.status === "pending") {
            Alert.alert(
              "Pending Approval",
              "Your account is awaiting admin approval. You'll be notified once approved."
            );
            navigation.replace("HomeDashboard");
          } else {
            // Status is "approved" - proceed to dashboard
            navigation.replace("HomeDashboard");
          }
        } else {
          // User logged in via Clerk but not in Firebase
          Alert.alert("Warning", "User profile not found. Proceeding to dashboard.");
          navigation.replace("HomeDashboard");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Clerk-specific error handling
      if (err.errors?.[0]?.code === "form_identifier_not_found") {
        Alert.alert("Error", "Email not found. Please check and try again.");
      } else if (err.errors?.[0]?.code === "form_password_incorrect") {
        Alert.alert("Error", "Incorrect password. Please try again.");
      } else {
        Alert.alert("Login Failed", err.errors?.[0]?.message || "An error occurred during sign-in");
      }
    } finally {
      setLoading(false);
    }
  };

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
              style={{
                flex: 1,
                paddingHorizontal: 24,
                paddingVertical: 40,
                justifyContent: "space-between",
              }}
            >
              {/* Header with Icon */}
              <View style={{ alignItems: "center", marginTop: 20 }}>
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
                  <Feather name="lock" size={36} color="#3b82f6" />
                </View>

                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: "700",
                    color: "#fff",
                    marginBottom: 8,
                    letterSpacing: -0.5,
                  }}
                >
                  Welcome Back
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: "#94a3b8",
                    textAlign: "center",
                  }}
                >
                  Sign in to access your mentorship journey
                </Text>
              </View>

              {/* Form */}
              <View>
                {/* Email Input */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      color: "#e2e8f0",
                      fontWeight: "600",
                      marginBottom: 10,
                      fontSize: 14,
                      letterSpacing: 0.3,
                    }}
                  >
                    Email Address
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: emailFocused ? "#1e293b" : "#0f172a",
                      borderWidth: 1.5,
                      borderColor: emailFocused ? "#3b82f6" : "#334155",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                    }}
                  >
                    <Feather
                      name="mail"
                      size={18}
                      color={emailFocused ? "#3b82f6" : "#64748b"}
                    />
                    <TextInput
                      placeholder="name@example.com"
                      placeholderTextColor="#475569"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                      style={{
                        flex: 1,
                        marginLeft: 12,
                        color: "white",
                        fontSize: 16,
                        fontWeight: "500",
                      }}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={{ marginBottom: 24 }}>
                  <Text
                    style={{
                      color: "#e2e8f0",
                      fontWeight: "600",
                      marginBottom: 10,
                      fontSize: 14,
                      letterSpacing: 0.3,
                    }}
                  >
                    Password
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: passwordFocused ? "#1e293b" : "#0f172a",
                      borderWidth: 1.5,
                      borderColor: passwordFocused ? "#3b82f6" : "#334155",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                    }}
                  >
                    <Feather
                      name="lock"
                      size={18}
                      color={passwordFocused ? "#3b82f6" : "#64748b"}
                    />
                    <TextInput
                      placeholder="Enter your password"
                      placeholderTextColor="#475569"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                      style={{
                        flex: 1,
                        marginLeft: 12,
                        color: "white",
                        fontSize: 16,
                        fontWeight: "500",
                      }}
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

                {/* Sign In Button */}
                <TouchableOpacity
                  onPress={handleEmailLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    shadowColor: "#3b82f6",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 6,
                  }}
                >
                  <LinearGradient
                    colors={["#6366f1", "#3b82f6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 24,
                    }}
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
                          letterSpacing: 0.5,
                        }}
                      >
                        Sign In
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: "#64748b" }}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("SignUp")}
                    disabled={loading}
                  >
                    <Text
                      style={{
                        color: "#3b82f6",
                        fontWeight: "700",
                        textDecorationLine: "underline",
                      }}
                    >
                      Create one
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text
                  style={{
                    color: "#475569",
                    fontSize: 12,
                    textAlign: "center",
                    fontStyle: "italic",
                  }}
                >
                  Mentify • Secure Authentication
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Login;
