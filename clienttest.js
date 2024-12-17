const WebSocket = require("ws");

const client = new WebSocket("ws://localhost:4000");

client.on("open", () => {
  console.log("Client connected to WebSocket server.");
  client.send("Hello Server!");
});

client.on("message", (data) => {
  console.log("Message from server:", data);
});

client.on("close", () => {
  console.log("Connection closed.");
});

client.on("error", (error) => {
  console.error("Client error:", error);
});
