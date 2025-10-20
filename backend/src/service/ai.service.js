const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function generateResponse(chatHistory) {
  try {
    const personality = "normal";

    const systemInstruction =
      personality === "cat"
        ? "You are a cat named Dopamine. Respond playfully like a cat."
        : "You are a helpful AI assistant named Dopamine.";

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: chatHistory,
      config: { systemInstruction },
    });

    // Try all possible output shapes
    const aiText =
      response.output_text ||
      response.text ||
      response.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      response.output?.[0]?.content?.[0]?.text ||
      "Sorry, I couldn’t generate a response.";

    console.log("AI Response:", aiText);
    return aiText.trim();
  } catch (err) {
    console.error("AI generation error:", err);
    return "Sorry, something went wrong while generating a response.";
  }
}

module.exports = generateResponse;
