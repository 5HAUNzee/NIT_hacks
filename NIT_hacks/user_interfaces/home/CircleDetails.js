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
import { sendMessageToGemini } from "../../services/geminiService";

const SENTIMENT_API_URL = "https://nit-hacks.onrender.com/analyze";

const CircleDetails = ({ route, navigation }) => {
  const { circleId } = route.params;
  const { user } = useUser();

  const [circle, setCircle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Discussion");
  const [messages, setMessages] = useState([]);
  const [messageSentiments, setMessageSentiments] = useState({});
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState("");
  const [loadingGemini, setLoadingGemini] = useState(false);

  useEffect(() => {
    fetchCircleDetails();
  }, [circleId]);

  useEffect(() => {
    if (circleId && activeTab === "Discussion") {
      const messagesRef = collection(db, "studyCircles", circleId, "messages");
      const q = query(messagesRef, orderBy("createdAt", "asc"));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const messagesList = [];
        snapshot.forEach((doc) => {
          messagesList.push({ id: doc.id, ...doc.data() });
        });
        setMessages(messagesList);
        await analyzeSentiments(messagesList);
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

  const analyzeSentiments = async (messagesList) => {
    const updatedSentiments = {};
    for (const msg of messagesList) {
      try {
        const response = await fetch(SENTIMENT_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: msg.text }),
        });
        const resData = await response.json();
        updatedSentiments[msg.id] = resData.overall || "neutral";
      } catch (error) {
        updatedSentiments[msg.id] = "error";
      }
    }
    setMessageSentiments(updatedSentiments);
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

  const askGeminiForHelp = async () => {
    setLoadingGemini(true);
    try {
      const textForGemini = messages.map((m) => m.text).join("\n");
      const prompt = `Analyze the following chat and provide advice or solutions:\n${textForGemini}`;
      const response = await sendMessageToGemini(prompt);
      setGeminiResponse(response);
    } catch (error) {
      Alert.alert("Error", "Failed to get response from Gemini");
      console.error(error);
    } finally {
      setLoadingGemini(false);
    }
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
      <View className="px-6 py-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mb-3">
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 mb-1">{circle?.name}</Text>
        <Text className="text-sm text-gray-600">
          {circle?.memberCount || 0} members • {circle?.subject}
        </Text>
      </View>

      <View className="flex-row border-b border-gray-200">
        {["Discussion"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3 ${activeTab === tab ? "border-b-2 border-black" : ""}`}
          >
            <Text className={`text-center text-sm font-medium ${activeTab === tab ? "text-gray-900" : "text-gray-500"}`}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "Discussion" && (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1" keyboardVerticalOffset={100}>
          <ScrollView className="flex-1 px-6 py-4">
            {messages.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Feather name="message-circle" size={48} color="#d1d5db" />
                <Text className="text-gray-500 mt-4">No messages yet</Text>
                <Text className="text-gray-400 text-sm mt-1">Start the conversation</Text>
              </View>
            ) : (
              messages.map((message) => (
                <View key={message.id} className="mb-4">
                  <View className="flex-row items-start">
                    <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                      <Text className="text-blue-700 font-semibold text-sm">{message.userInitials}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="font-semibold text-gray-900">{message.userName}</Text>
                        <Text
                          className={`text-xs ${
                            messageSentiments[message.id] === "positive"
                              ? "text-green-600"
                              : messageSentiments[message.id] === "negative"
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {messageSentiments[message.id] || "neutral"}
                        </Text>
                        <Text className="text-xs text-gray-500">{formatTime(message.createdAt)}</Text>
                      </View>
                      <Text className="text-gray-700">{message.text}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
            <View className="mt-8 px-2">
              <TouchableOpacity onPress={askGeminiForHelp} disabled={loadingGemini} className="bg-blue-600 rounded-xl py-3 items-center">
                {loadingGemini ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Ask Gemini for Solution</Text>}
              </TouchableOpacity>
              {geminiResponse ? (
                <View className="mt-4 bg-gray-100 p-4 rounded-lg">
                  <Text className="text-gray-900">{geminiResponse}</Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

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
                className={`px-4 py-3 rounded-xl ${messageText.trim() && !sending ? "bg-black" : "bg-gray-300"}`}
              >
                {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-semibold">Send</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

export default CircleDetails;
