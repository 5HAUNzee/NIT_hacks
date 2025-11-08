import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function Start({ navigation }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          clearInterval(timer);
          setTimeout(() => {
            navigation.replace("On1");
          }, 500);
          return 1;
        }
        return prev + 0.02;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [navigation]);

  const progressWidth = `${progress * 100}%`;

  return (
    <View style={styles.container}>
      {/* Card */}
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Feather name="users" size={60} color="#3b82f6" />
        </View>
        <Text style={styles.title}>Campus Connect</Text>
        <Text style={styles.subtitle}>Connect. Collaborate. Grow Together</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: progressWidth }]} />
      </View>
      <Text style={styles.loadingText}>Loading your experience...</Text>

      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 32,
    marginBottom: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#3b82f6",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 16,
    textAlign: "center",
  },
  progressBarContainer: {
    width: 250,
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 3,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 8,
  },
  versionContainer: {
    position: "absolute",
    bottom: 32,
  },
  versionText: {
    color: "#9ca3af",
    fontSize: 14,
  },
});