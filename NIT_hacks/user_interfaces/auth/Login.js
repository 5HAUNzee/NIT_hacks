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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Icon */}
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Feather name="lock" size={36} color="#3b82f6" />
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to connect with your campus community
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Feather name="mail" size={18} color="#3b82f6" />
                <Text style={styles.inputLabel}>Email Address</Text>
              </View>
              <View style={[styles.inputCard, emailFocused && styles.inputCardFocused]}>
                <TextInput
                  placeholder="name@example.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                  style={styles.input}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Feather name="lock" size={18} color="#3b82f6" />
                <Text style={styles.inputLabel}>Password</Text>
              </View>
              <View style={[styles.inputCard, passwordFocused && styles.inputCardFocused]}>
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
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

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleEmailLogin}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.signInButton, loading && styles.signInButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Feather name="log-in" size={20} color="white" />
                  <Text style={styles.signInButtonText}>Sign In</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.signUpRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("SignUp")}
                disabled={loading}
              >
                <Text style={styles.signUpLink}>Create one</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.brandText}>mitracircle • Campus Connect</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 40,
    justifyContent: "space-between",
  },
  headerSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  iconContainer: {
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
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
  },
  formSection: {
    marginBottom: 32,
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
    fontSize: 16,
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
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputCardFocused: {
    borderColor: "#3b82f6",
    borderWidth: 2,
  },
  input: {
    fontSize: 16,
    color: "#1f2937",
  },
  eyeButton: {
    padding: 4,
  },
  signInButton: {
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
  signInButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  signInButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  footer: {
    alignItems: "center",
  },
  signUpRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  footerText: {
    color: "#6b7280",
    fontSize: 14,
  },
  signUpLink: {
    color: "#3b82f6",
    fontWeight: "700",
    fontSize: 14,
  },
  brandText: {
    color: "#9ca3af",
    fontSize: 12,
  },
});

export default Login;
