import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  sendMessageToGemini,
  startChatSession,
} from "../../services/geminiService";

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState(null);
  const scrollViewRef = useRef();

  // Initialize chat session
  useEffect(() => {
    const initChat = async () => {
      try {
        const chatSession = await startChatSession();
        setChat(chatSession);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
      }
    };
    initChat();
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      // Get AI response
      const aiResponse = await sendMessageToGemini(inputText);

      const aiMessage = {
        id: messages.length + 2,
        text: aiResponse,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        text: "Sorry, I couldn't process that. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-6 py-4 border-b border-zinc-800 flex-row justify-between items-center">
        <View>
          <Text className="text-xs text-gray-600 tracking-widest">CHAT</Text>
          <Text className="text-2xl font-light text-white">Smart AI</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-zinc-900 justify-center items-center"
        >
          <Feather name="x" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            className={`mb-4 flex-row ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <View
              className={`max-w-xs px-4 py-3 rounded-2xl ${
                message.sender === "user"
                  ? "bg-blue-600"
                  : "bg-zinc-800 border border-zinc-700"
              }`}
            >
              <Text
                className={`text-base ${
                  message.sender === "user" ? "text-white" : "text-gray-200"
                }`}
              >
                {message.text}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View className="flex-row justify-start mb-4">
            <View className="bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-2xl">
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View className="px-6 py-4 border-t border-zinc-800">
        <View className="flex-row items-center gap-3">
          <TextInput
            placeholder="Ask me anything..."
            placeholderTextColor="#555"
            value={inputText}
            onChangeText={setInputText}
            editable={!loading}
            className="flex-1 bg-zinc-900 text-white px-4 py-3 rounded-2xl border border-zinc-800"
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={loading || !inputText.trim()}
            className={`w-10 h-10 rounded-full justify-center items-center ${
              loading || !inputText.trim() ? "bg-zinc-800" : "bg-blue-600"
            }`}
          >
            <Feather
              name="send"
              size={18}
              color={loading || !inputText.trim() ? "#666" : "#fff"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;
