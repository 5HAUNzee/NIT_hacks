import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase.config";
import { Feather } from "@expo/vector-icons";

const CreateCommunity = ({ navigation }) => {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Community name is required");
      return;
    }
    setCreating(true);
    try {
      await addDoc(collection(db, "communities"), {
        name: name.trim(),
        description: description.trim(),
        members: [user.id],
        createdAt: Timestamp.now(),
      });
      Alert.alert("Success", "Community created and you joined!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to create community");
    } finally {
      setCreating(false);
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
          <Text style={styles.headerTitle}>Create Community</Text>
          <Text style={styles.headerSubtitle}>Build your own space</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Community Icon Placeholder */}
        <View style={styles.iconSection}>
          <View style={styles.communityIconLarge}>
            <Feather name="users" size={48} color="#3b82f6" />
          </View>
          <Text style={styles.iconLabel}>Community Icon</Text>
        </View>

        {/* Community Name Input */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Feather name="edit-3" size={18} color="#3b82f6" />
            <Text style={styles.inputLabel}>Community Name *</Text>
          </View>
          <View style={[styles.inputCard, name && styles.inputCardActive]}>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Enter community name"
              placeholderTextColor="#9ca3af"
              maxLength={50}
            />
          </View>
          <Text style={styles.characterCount}>{name.length}/50 characters</Text>
        </View>

        {/* Description Input */}
        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <Feather name="file-text" size={18} color="#3b82f6" />
            <Text style={styles.inputLabel}>Description</Text>
          </View>
          <View style={[styles.inputCard, description && styles.inputCardActive]}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textArea]}
              placeholder="What's your community about? (optional)"
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
          </View>
          <Text style={styles.characterCount}>{description.length}/200 characters</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Feather name="info" size={18} color="#3b82f6" />
            <Text style={styles.infoTitle}>Community Guidelines</Text>
          </View>
          <Text style={styles.infoText}>
            • You'll be the first member and admin{"\n"}
            • Create a welcoming space for everyone{"\n"}
            • Encourage meaningful discussions
          </Text>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          disabled={creating || !name.trim()}
          onPress={create}
          style={[
            styles.createButton,
            (creating || !name.trim()) && styles.createButtonDisabled
          ]}
          activeOpacity={0.8}
        >
          {creating ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Feather name="check-circle" size={20} color="white" />
              <Text style={styles.createButtonText}>Create Community</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  iconSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  communityIconLarge: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#3b82f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconLabel: {
    color: "#6b7280",
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  inputSection: {
    marginBottom: 24,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputCardActive: {
    borderColor: "#3b82f6",
    borderWidth: 2,
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: "#1f2937",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  characterCount: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoTitle: {
    color: "#1f2937",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 15,
  },
  infoText: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowOpacity: 0,
  },
  createButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
});

export default CreateCommunity;
