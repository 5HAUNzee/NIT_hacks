import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useUser } from "@clerk/clerk-expo";
import * as DocumentPicker from "expo-document-picker";
import { uploadPDFToCloudinary } from "../../services/cloudinaryService";

const CircleDetails = ({ route, navigation }) => {
  const { circleId } = route.params;
  const { user } = useUser();
  const [circle, setCircle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Discussion");
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingNote, setUploadingNote] = useState(false);

  useEffect(() => {
    fetchCircleDetails();
  }, [circleId]);

  // Real-time messages listener
  useEffect(() => {
    if (circleId && activeTab === "Discussion") {
      const messagesRef = collection(db, "studyCircles", circleId, "messages");
      const q = query(messagesRef, orderBy("createdAt", "asc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesList = [];
        snapshot.forEach((doc) => {
          messagesList.push({ id: doc.id, ...doc.data() });
        });
        setMessages(messagesList);
      });

      return () => unsubscribe();
    }
  }, [circleId, activeTab]);

  // Real-time notes listener
  useEffect(() => {
    if (circleId && activeTab === "Notes") {
      const notesRef = collection(db, "studyCircles", circleId, "notes");
      const q = query(notesRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notesList = [];
        snapshot.forEach((doc) => {
          notesList.push({ id: doc.id, ...doc.data() });
        });
        setNotes(notesList);
      });

      return () => unsubscribe();
    }
  }, [circleId, activeTab]);

  const fetchCircleDetails = async () => {
    try {
      const circleRef = doc(db, "studyCircles", circleId);
      const circleSnap = await getDoc(circleRef);

      if (circleSnap.exists()) {
        setCircle({ id: circleSnap.id, ...circleSnap.data() });
      }
    } catch (error) {
      console.error("Error fetching circle:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      const messagesRef = collection(db, "studyCircles", circleId, "messages");
      await addDoc(messagesRef, {
        text: messageText.trim(),
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userInitials: `${user.firstName?.[0]}${user.lastName?.[0]}`,
        createdAt: Timestamp.now(),
      });

      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const uploadNote = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.type === "success" || !result.canceled) {
        const file = result.assets ? result.assets[0] : result;
        
        setUploadingNote(true);

        // Upload to Cloudinary
        const cloudinaryUrl = await uploadPDFToCloudinary(file.uri, file.name);

        // Save to Firestore
        const notesRef = collection(db, "studyCircles", circleId, "notes");
        await addDoc(notesRef, {
          title: file.name,
          url: cloudinaryUrl,
          uploadedBy: user.id,
          uploaderName: `${user.firstName} ${user.lastName}`,
          createdAt: Timestamp.now(),
        });

        Alert.alert("Success", "Note uploaded successfully!");
      }
    } catch (error) {
      console.error("Error uploading note:", error);
      Alert.alert("Error", "Failed to upload note");
    } finally {
      setUploadingNote(false);
    }
  };

  const openNote = (url) => {
    Linking.openURL(url);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-3">
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 mb-1">
          {circle?.name}
        </Text>
        <Text className="text-sm text-gray-600">
          {circle?.memberCount || 0} members • {circle?.subject}
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-gray-200">
        {["Discussion", "Notes", "Sessions"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3 ${
              activeTab === tab ? "border-b-2 border-black" : ""
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                activeTab === tab ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Discussion Tab */}
      {activeTab === "Discussion" && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={100}
        >
          <ScrollView className="flex-1 px-6 py-4">
            {messages.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Feather name="message-circle" size={48} color="#d1d5db" />
                <Text className="text-gray-500 mt-4">No messages yet</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Start the conversation
                </Text>
              </View>
            ) : (
              messages.map((message) => (
                <View key={message.id} className="mb-4">
                  <View className="flex-row items-start">
                    <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                      <Text className="text-blue-700 font-semibold text-sm">
                        {message.userInitials}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="font-semibold text-gray-900">
                          {message.userName}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {formatTime(message.createdAt)}
                        </Text>
                      </View>
                      <Text className="text-gray-700">{message.text}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Message Input */}
          <View className="px-6 py-3 border-t border-gray-200">
            <View className="flex-row items-center gap-3">
              <TextInput
                placeholder="Type a message..."
                placeholderTextColor="#9ca3af"
                value={messageText}
                onChangeText={setMessageText}
                multiline
                className="flex-1 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-gray-900"
              />
              <TouchableOpacity
                onPress={sendMessage}
                disabled={!messageText.trim() || sending}
                className={`px-4 py-3 rounded-xl ${
                  messageText.trim() && !sending ? "bg-black" : "bg-gray-300"
                }`}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Notes Tab */}
      {activeTab === "Notes" && (
        <View className="flex-1">
          <ScrollView className="flex-1 px-6 py-4">
            {notes.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Feather name="file-text" size={48} color="#d1d5db" />
                <Text className="text-gray-500 mt-4">No notes yet</Text>
                <Text className="text-gray-400 text-sm mt-1 text-center">
                  Share study notes with your circle
                </Text>
              </View>
            ) : (
              notes.map((note) => (
                <TouchableOpacity
                  key={note.id}
                  onPress={() => openNote(note.url)}
                  className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex-row items-center"
                >
                  <View className="w-12 h-12 bg-red-100 rounded-lg items-center justify-center mr-4">
                    <Feather name="file-text" size={24} color="#ef4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                      {note.title}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Uploaded by {note.uploaderName} •{" "}
                      {formatTime(note.createdAt)}
                    </Text>
                  </View>
                  <Feather name="external-link" size={18} color="#9ca3af" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Upload Button */}
          <View className="px-6 py-4 border-t border-gray-200">
            <TouchableOpacity
              onPress={uploadNote}
              disabled={uploadingNote}
              className="bg-black py-4 rounded-xl flex-row items-center justify-center"
            >
              {uploadingNote ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="upload" size={20} color="#fff" />
                  <Text className="text-white font-semibold ml-2">
                    Upload PDF Note
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sessions Tab */}
      {activeTab === "Sessions" && (
        <View className="flex-1 items-center justify-center px-6">
          <Feather name="calendar" size={48} color="#d1d5db" />
          <Text className="text-gray-500 mt-4">No sessions scheduled</Text>
          <Text className="text-gray-400 text-sm mt-1 text-center">
            Schedule study sessions with members
          </Text>
          <TouchableOpacity className="mt-6 bg-black px-6 py-3 rounded-xl">
            <Text className="text-white font-semibold">Schedule Session</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CircleDetails;
