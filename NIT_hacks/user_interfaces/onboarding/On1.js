import React, { useState } from "react";
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const onboardingSlides = [
  {
    icon: "users",
    title: "Connect with Peers",
    description:
      "Join communities, study circles, and collaborate with students across campus",
    color: "#3b82f6",
  },
  {
    icon: "calendar",
    title: "Stay Updated",
    description: "Never miss campus events, workshops, and important announcements",
    color: "#10b981",
  },
  {
    icon: "folder",
    title: "Manage Projects",
    description: "Create, share, and collaborate on projects with your team effortlessly",
    color: "#8b5cf6",
  },
];

export default function On1({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = onboardingSlides[currentSlide];

  const handleNavigateToAuth = () => {
    navigation.navigate("Login");
  };

  const nextSlide = () => {
    if (currentSlide === onboardingSlides.length - 1) {
      handleNavigateToAuth();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  const isLastSlide = currentSlide === onboardingSlides.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip Button - Top Right */}
      {!isLastSlide && (
        <TouchableOpacity
          onPress={handleNavigateToAuth}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Icon Container */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${slide.color}15` },
          ]}
        >
          <Feather name={slide.icon} size={56} color={slide.color} />
        </View>

        {/* Title */}
        <Text style={styles.title}>{slide.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{slide.description}</Text>

        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {onboardingSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSlide ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          {/* Back Button - Only show if not first slide */}
          {currentSlide > 0 ? (
            <TouchableOpacity onPress={prevSlide} style={styles.navButton}>
              <Feather name="chevron-left" size={24} color="#3b82f6" />
            </TouchableOpacity>
          ) : (
            <View style={styles.spacer} />
          )}

          {/* Next/Get Started Button */}
          {!isLastSlide ? (
            <TouchableOpacity onPress={nextSlide} style={styles.navButton}>
              <Feather name="chevron-right" size={24} color="#3b82f6" />
            </TouchableOpacity>
          ) : (
            <View style={styles.getStartedContainer}>
              <TouchableOpacity
                onPress={handleNavigateToAuth}
                style={styles.getStartedButton}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
                <Feather name="arrow-right" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  skipButton: {
    position: "absolute",
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  skipText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 24,
  },
  description: {
    fontSize: 17,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 64,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: "#3b82f6",
    width: 24,
  },
  dotInactive: {
    backgroundColor: "#d1d5db",
  },
  bottomNav: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
  },
  navButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  navButton: {
    padding: 16,
    borderRadius: 50,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  spacer: {
    width: 48,
  },
  getStartedContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  getStartedButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    width: "100%",
    maxWidth: 300,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  getStartedText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});