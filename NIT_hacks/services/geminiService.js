import { GoogleGenerativeAI } from "@google/generative-ai";

// Load API key from environment. Put your key in a local `.env` as GEMINI_API_KEY.
// If you don't have dotenv wired in your environment (React Native/Expo needs a specific approach),
// ensure the environment variable is provided by your runtime/CI.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "<REPLACE_WITH_GEMINI_API_KEY>";
if (GEMINI_API_KEY === "<REPLACE_WITH_GEMINI_API_KEY>") {
  console.warn("Warning: GEMINI_API_KEY not set. Set it in a .env file or environment variables.");
}
// ✅ USE LATEST MODEL
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
