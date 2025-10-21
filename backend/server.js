require('dotenv').config();
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const generateResponse = require('./src/service/ai.service');


app.use(
  cors({
    origin: [
      "https://ai-chat-boat-green.vercel.app", // your Vercel frontend
      "http://localhost:5173" // for local dev testing
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);



const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: [ "https://ai-chat-boat-green.vercel.app","http://localhost:5173"],
  methods: ["GET", "POST"],
  credentials: true, },
});

const chatHistory = [];

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  socket.on("ai-message", async (data) => {
    console.log("Ai message received:", data);

    // ✅ Correct structure for @google/genai
    chatHistory.push({
      role: "user",
      parts: [{ text: data }],
    });

    const aiResponse = await generateResponse(chatHistory);

    // ✅ Store AI reply
    chatHistory.push({
      role: "model",
      parts: [{ text: aiResponse }],
    });

    // Send it back to client
    socket.emit("ai-message-response", aiResponse);
  });
});

httpServer.listen(3000, () => {
  console.log("✅ Server is running on port 3000");
});
