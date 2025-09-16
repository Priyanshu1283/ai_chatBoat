const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

async function generateResponse(chatHistory) {
   const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: chatHistory,
  });
  console.log(response.text);
}

module.exports = generateResponse;