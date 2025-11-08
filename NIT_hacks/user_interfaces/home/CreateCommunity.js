import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase.config";

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
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>Community Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 20 }}
        placeholder="Community Name"
      />
      <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={{ borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, height: 100, marginBottom: 20 }}
        placeholder="Description (optional)"
        multiline
      />
      <TouchableOpacity
        disabled={creating}
        onPress={create}
        style={{
          backgroundColor: creating ? "#9ca3af" : "#3b82f6",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        {creating ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "bold" }}>Create</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CreateCommunity;
