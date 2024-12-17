// const WebSocket = require("ws");
// const server = new WebSocket.Server({ port: 4000 }); // Thay đổi port từ 8080 thành 4000

// server.on("connection", (ws) => {
//   console.log("A new client connected!");

//   // Hàm gửi thông báo cho client (người quản lý)
//   const sendPaymentSuccessNotification = (paymentInfo) => {
//     ws.send(JSON.stringify({ event: "payment_success", data: paymentInfo }));
//   };

//   // Khi nhận được thông báo thanh toán thành công từ backend
//   ws.on("message", (message) => {
//     console.log("Received message:", message);
//   });
// });

// module.exports = server;
