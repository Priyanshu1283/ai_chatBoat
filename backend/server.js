require('dotenv').config();
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const generateResponse = require('./src/service/ai.service');

const httpServer = createServer(app);

const allowedOrigins = [
  "https://ai-chat-boat-green.vercel.app", // ✅ your deployed frontend
  "http://localhost:5173" // ✅ local dev
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

const chatHistory = [];

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  socket.on("ai-message", async (data) => {
    console.log("Ai message received:", data);

    chatHistory.push({
      role: "user",
      parts: [{ text: data }],
    });

    try {
      const aiResponse = await generateResponse(chatHistory);

      chatHistory.push({
        role: "model",
        parts: [{ text: aiResponse }],
      });

      socket.emit("ai-message-response", aiResponse);
      console.log("AI Response sent:", aiResponse);
    } catch (error) {
      console.error("Error generating AI response:", error);
      socket.emit("ai-message-response", "Sorry, something went wrong.");
    }
  });
});

httpServer.listen(3000, () => {
  console.log("✅ Server is running on port 3000");
});
