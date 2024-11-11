const socketIO = require("socket.io");
const JWT = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/userModel");
dotenv.config();

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "*",  // Cho phép tất cả các nguồn kết nối
      methods: ["GET", "POST"]
    }
  });

  // Middleware để xác thực JWT token khi kết nối socket
  io.use(async (socket, next) => {
    const token = socket.handshake.query.token;  // Token được gửi qua query
    if (!token) return next(new Error("Authentication error"));

    try {
      const decoded = JWT.verify(token, process.env.PUBLIC_KEY);
      const userId = decoded.userId;
      console.log("Decoded userId:", userId);

      const user = await User.findById(userId);
      if (!user) {
        console.error("User not found with ID:", userId);
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error("JWT verification error:", err);
      return next(new Error("Authentication error"));
    }
  });

  // Xử lý sự kiện kết nối
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.user);

    socket.emit("welcome", { message: "Welcome to the socket server!" });

    socket.on("clientEvent", (data) => {
      console.log("Received from client:", data);
      socket.broadcast.emit("serverEvent", { message: "New event from server" });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.user);
    });
  });

  return io;
};

module.exports = {
  initializeSocket
};
