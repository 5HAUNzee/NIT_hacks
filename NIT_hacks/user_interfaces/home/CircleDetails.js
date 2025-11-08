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
  Modal,
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
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useUser } from "@clerk/clerk-expo";
import * as DocumentPicker from "expo-document-picker";
import { uploadPDFToCloudinary } from "../../services/cloudinaryService";
import Sentiment from "sentiment";
import { sendMessageToGemini } from "../../services/geminiService";

const CircleDetails = ({ route, navigation }) => {
  const { circleId } = route.params;
  const { user } = useUser();
  const [circle, setCircle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Discussion");
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingNote, setUploadingNote] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionLink, setSessionLink] = useState("");
  const [sessionDateString, setSessionDateString] = useState("");
  const [addingSession, setAddingSession] = useState(false);
  const [geminiResponses, setGeminiResponses] = useState({});
  
  const sentiment = new Sentiment();

  useEffect(() => {
    fetchCircleDetails();
  }, [circleId]);

  useEffect(() => {
    if (circleId && activeTab === "Discussion") {
      const messagesRef = collection(db, "studyCircles", circleId, "messages");
      const q = query(messagesRef, orderBy("createdAt", "asc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesList = [];
        snapshot.forEach((doc) => messagesList.push({ id: doc.id, ...doc.data() }));
        setMessages(messagesList);
      });
      return () => unsubscribe();
    }
  }, [circleId, activeTab]);

  useEffect(() => {
    if (circleId && activeTab === "Notes") {
      const notesRef = collection(db, "studyCircles", circleId, "notes");
      const q = query(notesRef, orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notesList = [];
        snapshot.forEach((doc) => notesList.push({ id: doc.id, ...doc.data() }));
        setNotes(notesList);
      });
      return () => unsubscribe();
    }
  }, [circleId, activeTab]);

  useEffect(() => {
    if (circleId && activeTab === "Sessions") {
      const sessionsRef = collection(db, "studyCircles", circleId, "sessions");
      const q = query(sessionsRef, orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const sessionsList = [];
        snapshot.forEach((doc) => sessionsList.push({ id: doc.id, ...doc.data() }));
        setSessions(sessionsList);
      });
      return () => unsubscribe();
    }
  }, [circleId, activeTab]);

  const fetchCircleDetails = async () => {
    try {
      const circleRef = doc(db, "studyCircles", circleId);
      const circleSnap = await getDoc(circleRef);
      if (circleSnap.exists()) setCircle({ id: circleSnap.id, ...circleSnap.data() });
    } catch (error) {
      console.error("Error fetching circle:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSentiment = (text) => {
    const result = sentiment.analyze(text);
    if (result.score > 1) return "Positive";
    else if (result.score < -1) return "Negative";
    else return "Neutral";
  };

  const requestGeminiAnalysis = async (messageId, messageText) => {
    try {
      const geminiResponse = await sendMessageToGemini(messageText);
      setGeminiResponses((prev) => ({ ...prev, [messageId]: geminiResponse }));
    } catch (error) {
      Alert.alert("Error", "Failed to get Gemini analysis");
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || sending) return;
    setSending(true);
    try {
      const score = sentiment.analyze(messageText.trim()).score;
      if (score < -3) {
        Alert.alert("Inappropriate Message", "Please avoid posting negative or harmful content.");
        setSending(false);
        return;
      }
      const chatContext = messages.map((m) => m.text).join("\n") + "\n" + messageText.trim();
      const geminiResponse = await sendMessageToGemini(chatContext);
      console.log("Gemini summary:", geminiResponse);
      const messagesRef = collection(db, "studyCircles", circleId, "messages");
      await addDoc(messagesRef, {
        text: messageText.trim(),
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userInitials: `${user.firstName?.[0]}${user.lastName?.[0]}`,
        createdAt: Timestamp.now(),
        geminiSummary: geminiResponse,
      });
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const uploadNote = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
      if (result.type === "success" || !result.canceled) {
        const file = result.assets ? result.assets[0] : result;
        setUploadingNote(true);
        const cloudinaryUrl = await uploadPDFToCloudinary(file.uri, file.name);
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

  const deleteNote = async (noteId, uploadedBy) => {
    if (uploadedBy !== user.id) {
      Alert.alert("Error", "You can only delete your own notes");
      return;
    }
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const noteRef = doc(db, "studyCircles", circleId, "notes", noteId);
            await deleteDoc(noteRef);
            Alert.alert("Success", "Note deleted successfully");
          } catch (error) {
            console.error("Error deleting note:", error);
            Alert.alert("Error", "Failed to delete note");
          }
        },
      },
    ]);
  };

  const addSession = async () => {
    if (!sessionTitle.trim() || !sessionLink.trim() || !sessionDateString.trim()) {
      Alert.alert("Please fill out all fields");
      return;
    }
    setAddingSession(true);
    try {
      const sessionsRef = collection(db, "studyCircles", circleId, "sessions");
      await addDoc(sessionsRef, {
        title: sessionTitle.trim(),
        meetingTime: sessionDateString.trim(),
        meetingLink: sessionLink.trim(),
        createdBy: user.id,
        creatorName: `${user.firstName} ${user.lastName}`,
        createdAt: Timestamp.now(),
      });
      setShowSessionModal(false);
      setSessionTitle("");
      setSessionLink("");
      setSessionDateString("");
    } catch (error) {
      console.error("Error creating session:", error);
      Alert.alert("Error", "Failed to create session");
    } finally {
      setAddingSession(false);
    }
  };

  const openNote = (url) => Linking.openURL(url);
  const openSessionLink = (url) => Linking.openURL(url);

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
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 12 }}>
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827" }}>{circle?.name}</Text>
        <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>{circle?.memberCount} members • {circle?.subject}</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
        {["Discussion", "Notes", "Sessions"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderBottomWidth: activeTab === tab ? 3 : 0,
              borderColor: "#111827",
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: "600", color: activeTab === tab ? "#111827" : "#6b7280" }}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Discussion Tab */}
      {activeTab === "Discussion" && (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={100}>
          <ScrollView style={{ flex: 1, padding: 24 }}>
            {messages.length === 0 ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
                <Feather name="message-circle" size={48} color="#d1d5db" />
                <Text style={{ marginTop: 16, color: "#6b7280" }}>No messages yet</Text>
              </View>
            ) : (
              messages.map((msg) => {
                const sentimentLabel = analyzeSentiment(msg.text);
                return (
                  <View key={msg.id} style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#bfdbfe", justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                        <Text style={{ color: "#2563eb", fontWeight: "bold" }}>{msg.userInitials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={{ fontWeight: "bold", color: "#111827", marginBottom: 4 }}>{msg.userName}</Text>
                          <Text style={{ fontStyle: "italic", color: "#6b7280" }}>{sentimentLabel}</Text>
                        </View>
                        <Text style={{ color: "#374151" }}>{msg.text}</Text>
                        {geminiResponses[msg.id] ? (
                          <View style={{ marginTop: 8, backgroundColor: "#f3f4f6", padding: 8, borderRadius: 8 }}>
                            <Text style={{ color: "#111827" }}>{geminiResponses[msg.id]}</Text>
                          </View>
                        ) : (
                          <TouchableOpacity onPress={() => requestGeminiAnalysis(msg.id, msg.text)} style={{ marginTop: 4 }}>
                            <Text style={{ color: "#3b82f6", fontWeight: "600" }}>Analyze with Gemini</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
          <View style={{ padding: 16, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#e5e7eb" }}>
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor="#6b7280"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              style={{ flex: 1, backgroundColor: "#f3f4f6", padding: 12, borderRadius: 25, maxHeight: 100 }}
            />
            <TouchableOpacity
              disabled={!messageText.trim() || sending}
              onPress={sendMessage}
              style={{
                marginLeft: 12,
                backgroundColor: !messageText.trim() || sending ? "#d1d5db" : "#111827",
                padding: 12,
                borderRadius: 25,
              }}
            >
              {sending ? <ActivityIndicator color="#fff" /> : <Feather name="send" size={22} color="#fff" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
   {activeTab === "Notes" && (
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1, padding: 24 }}>
            {notes.length === 0 ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
                <Feather name="file-text" size={48} color="#d1d5db" />
                <Text style={{ marginTop: 16, color: "#6b7280" }}>No notes yet</Text>
                <Text style={{ marginTop: 8, color: "#9ca3af", textAlign: "center" }}>Share study notes with your circle</Text>
              </View>
            ) : (
              notes.map((note) => (
                <View key={note.id} style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <TouchableOpacity onPress={() => openNote(note.url)} style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ width: 48, height: 48, backgroundColor: "#fee2e2", borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 16 }}>
                      <Feather name="file-text" size={24} color="#b91c1c" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 4 }}>{note.title}</Text>
                      <Text style={{ fontSize: 12, color: "#6b7280" }}>Uploaded by {note.uploaderName} • {formatTime(note.createdAt)}</Text>
                    </View>
                    <Feather name="external-link" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                  {note.uploadedBy === user.id && (
                    <TouchableOpacity onPress={() => deleteNote(note.id, note.uploadedBy)} style={{ marginTop: 12, backgroundColor: "#fee2e2", padding: 8, borderRadius: 8, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                      <Feather name="trash-2" size={16} color="#b91c1c" />
                      <Text style={{ color: "#b91c1c", fontWeight: "600", marginLeft: 8 }}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </ScrollView>
          <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" }}>
            <TouchableOpacity onPress={uploadNote} disabled={uploadingNote} style={{ backgroundColor: uploadingNote ? "#a5b4fc" : "#111827", paddingVertical: 16, borderRadius: 12, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6 }}>
              {uploadingNote ? <ActivityIndicator color="#fff" /> : <Feather name="upload" size={20} color="#fff" />}
              <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>Upload PDF Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === "Sessions" && (
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1, padding: 24 }}>
            {sessions.length === 0 ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
                <Feather name="calendar" size={48} color="#d1d5db" />
                <Text style={{ marginTop: 16, color: "#6b7280" }}>No sessions scheduled</Text>
                <Text style={{ marginTop: 8, color: "#9ca3af", textAlign: "center" }}>Schedule study sessions with members</Text>
              </View>
            ) : (
              sessions.map((session) => (
                <View key={session.id} style={{ backgroundColor: "white", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>{session.title}</Text>
                  <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>{session.meetingTime}</Text>
                  <TouchableOpacity onPress={() => openSessionLink(session.meetingLink)} style={{ flexDirection: "row", alignItems: "center" }}>
                    <Feather name="external-link" size={20} color="#2563eb" />
                    <Text style={{ marginLeft: 8, fontWeight: "600", color: "#2563eb" }}>Join Meeting</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>Scheduled by {session.creatorName}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <View style={{ paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" }}>
            <TouchableOpacity onPress={() => setShowSessionModal(true)} style={{ backgroundColor: "#111827", paddingVertical: 16, borderRadius: 12, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 8 }}>
              <Feather name="plus-circle" size={20} color="#fff" />
              <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Schedule New Session</Text>
            </TouchableOpacity>
          </View>
          <Modal
            visible={showSessionModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowSessionModal(false)}
          >
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 }}>
              <View style={{ backgroundColor: "white", borderRadius: 16, padding: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>Schedule Session</Text>
                <TextInput placeholder="Session Title" value={sessionTitle} onChangeText={setSessionTitle} style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, padding: 12, marginBottom: 12 }} />
                <TextInput placeholder="Pick date & time (e.g. Mon 10 Nov, 6:30PM)" value={sessionDateString} onChangeText={setSessionDateString} style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, padding: 12, marginBottom: 12 }} />
                <TextInput placeholder="Meeting Link (e.g., Google Meet)" value={sessionLink} onChangeText={setSessionLink} style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12, padding: 12, marginBottom: 24 }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <TouchableOpacity onPress={addSession} disabled={addingSession} style={{ backgroundColor: "#111827", flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginRight: 12 }}>
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>{addingSession ? "Scheduling..." : "Schedule"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowSessionModal(false)} style={{ backgroundColor: "#e5e7eb", flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" }}>
                    <Text style={{ color: "#374151", fontWeight: "700", fontSize: 16 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}
      

    </SafeAreaView>
  );
};

export default CircleDetails;
