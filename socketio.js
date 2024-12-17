const { Server } = require("socket.io");

let io;

const initSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

const emitEvent = (event, data) => {
  if (io) {
    io.emit(event, data);
  } else {
    console.error("Socket.IO has not been initialized.");
  }
};

module.exports = { initSocketIO, emitEvent };
