import { GoogleGenerativeAI } from "@google/generative-ai";

// ✅ USE LATEST MODEL
const genAI = new GoogleGenerativeAI("AIzaSyAfnpco67GQGvlectcdU7lo32qLaFU7600");

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // ✅ CHANGED

export const sendMessageToGemini = async (userMessage) => {
  try {
    console.log("📤 Sending to Gemini:", userMessage);

    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();

    console.log("📥 Gemini response:", text);
    return text;
  } catch (error) {
    console.error("❌ Gemini API error:", error.message);
    throw error;
  }
};

export const startChatSession = async () => {
  try {
    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.9,
      },
    });
    return chat;
  } catch (error) {
    console.error("❌ Error starting chat:", error);
    throw error;
  }
};

export const sendChatMessage = async (chat, userMessage) => {
  try {
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("❌ Chat error:", error);
    throw error;
  }
};
