import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/user.routes.js";
import messageRouter from "./routes/message.routes.js";
import { Server } from "socket.io";
import session from "express-session";
import MongoStore from "connect-mongo";

const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: "7mb" }));
app.use(cors({
  origin : process.env.FRONTEND_URL,
  credentials : true,
  methods : ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized : false,
    store : MongoStore.create({
      mongoUrl : process.env.MONGO_URI,
      ttl : 7*24*60*60,
      autoRemove : 'native'
    }),
    cookie: {
      maxAge: 7*24*60*60*1000,
      httpOnly : true,
      sameSite : 'none',
      secure : true
    }
  })
)
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
  },
});

export const userSocketMap = {}; // { userId: socketId }

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected", userId);

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

await connectDB();

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
