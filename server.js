const {syncAllCartsToDatabase} = require('./src/redisDB/redisCart')
const app = require('./src/app')
const {app:{port}} = require('./src/configs/configMongodb')
const server = app.listen(port, ()=>{
    console.log(`server started port ${port}`)
})

process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await syncAllCartsToDatabase();  // Đồng bộ giỏ hàng vào MongoDB trước khi tắt
    server.close(() => {
        console.log('Server closed');
        process.exit(0); // Dừng tiến trình sau khi server đóng
    });
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await syncAllCartsToDatabase();  // Đồng bộ giỏ hàng vào MongoDB trước khi tắt
    server.close(() => {
        console.log('Server closed');
        process.exit(0); // Dừng tiến trình sau khi server đóng
    });
});
