const { GoogleGenAI } = require("@google/genai");

const apiKey = (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "").trim();
const ai = new GoogleGenAI({ apiKey });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateResponse(chatHistory, retryCount = 0) {
  const maxRetries = 2;
  try {
    if (!apiKey) {
      console.error("AI generation error: Missing GOOGLE_API_KEY or GEMINI_API_KEY in .env");
      return "Server is missing the API key. Please add GOOGLE_API_KEY or GEMINI_API_KEY to the backend .env file.";
    }

    const personality = "normal";

    const systemInstruction =
      personality === "cat"
        ? "You are a cat named demo. Respond playfully like a cat. Never say Domo; your name is only demo."
        : "You are a helpful AI assistant named demo. Never say Domo—always introduce yourself as demo only. Created by Priyanshu.";

    // Use gemini-1.5-flash: free tier often has quota (gemini-2.0-flash can show limit: 0)
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const response = await ai.models.generateContent({
        model,
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
    const status = err.status || err.statusCode;
    const isRateLimit = status === 429 || (err.message && String(err.message).includes("429"));

    if (isRateLimit && retryCount < maxRetries) {
      const raw = String(err.message || err);
      const match = raw.match(/retry in (\d+(?:\.\d+)?)\s*s/i) || raw.match(/retryDelay":\s*"(\d+)s/);
      const waitSec = match ? Math.ceil(parseFloat(match[1])) + 1 : 5;
      console.warn("Gemini rate limit (429). Retrying in " + waitSec + "s (attempt " + (retryCount + 1) + "/" + maxRetries + ")...");
      await sleep(waitSec * 1000);
      return generateResponse(chatHistory, retryCount + 1);
    }

    console.error("AI generation error:", err.message || err);

    if (status === 429) {
      return "I'm getting too many requests right now (free tier limit). Please wait a minute and try again, or check your Gemini API quota at https://ai.google.dev/gemini-api/docs/rate-limits.";
    } 
    if (status === 401 || status === 403) {
      return "API key is invalid or not allowed. Please check your Gemini/Google API key in the backend .env file.";
    }
    return "Sorry, something went wrong while generating a response. Please try again.";
  }
}

module.exports = generateResponse;
