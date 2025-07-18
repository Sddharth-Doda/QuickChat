import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/user.routes.js";
import messageRouter from "./routes/message.routes.js";
import { Server } from "socket.io";

// Create express app and HTTP server
const app = express();
const server = http.createServer(app);

// Allow frontend domains
const allowedOrigins = [
  "http://localhost:5173", // dev
  "https://quick-chat-lake.vercel.app" // vercel
];

// Middleware setup
app.use(express.json({ limit: "7mb" }));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.options("*", cors()); // handle preflight

// Initialize socket.io server
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  }
});

// Store online users
export const userSocketMap = {};   // { userId: socketId }

// socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected", userId);

  if (userId) userSocketMap[userId] = socket.id;

  // Emit online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect to DB and start server
await connectDB();

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
