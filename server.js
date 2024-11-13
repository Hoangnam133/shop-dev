const app = require('./src/app')
const {app:{port}} = require('./src/configs/configMongodb')
const server = app.listen(port, ()=>{
    console.log(`server started port ${port}`)
})
// const http = require('http');
// const app = require('./src/app');  // Import app.js
// const { initializeSocket } = require('./src/configs/socketConfig');  // Import socketConfig
// const { app: { port } } = require('./src/configs/configMongodb');

// // Khởi tạo HTTP server từ Express app
// const server = http.createServer(app);

// // Khởi tạo Socket.IO
// initializeSocket(server);

// // Lắng nghe trên cổng
// server.listen(port, () => {
//     console.log(`Server started on port ${port}`);
// });
