require('dotenv').config();
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const generateResponse = require('./src/service/ai.service');

const httpServer = createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

const chatHistoryBySocket = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  chatHistoryBySocket.set(socket.id, []);

  socket.on("disconnect", () => {
    chatHistoryBySocket.delete(socket.id);
    console.log("A user disconnected:", socket.id);
  });

  socket.on("clear-chat", () => {
    chatHistoryBySocket.set(socket.id, []);
    console.log("Chat cleared for:", socket.id);
  });

  socket.on("ai-message", async (data) => {
    console.log("AI message received:", data);
    const chatHistory = chatHistoryBySocket.get(socket.id) || [];

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
      console.log("AI Response sent");
    } catch (error) {
      console.error("Error generating AI response:", error);
      socket.emit("ai-message-response", "Sorry, something went wrong. Please try again.");
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
