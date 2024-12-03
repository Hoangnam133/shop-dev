const { syncAllCartsToDatabase } = require('./src/redisDB/redisCart');
const app = require('./src/app');
const { app: { port } } = require('./src/configs/configMongodb');
const server = app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

// Hàm xử lý tắt server an toàn
const handleShutdown = async (signal) => {
    console.log(`${signal} received, shutting down gracefully...`);
    
    try {
        console.log('Starting cart synchronization...');
        const syncToDB = await syncAllCartsToDatabase(); // Đồng bộ giỏ hàng vào MongoDB
        if (syncToDB) {
            console.log('Cart synchronization completed successfully.');
        } else {
            console.log('No carts to synchronize.');
        }
        console.log('Cart synchronization completed successfully.');
    } catch (error) {
        console.error('Error during cart synchronization:', error);
    }

    server.close((err) => {
        if (err) {
            console.error('Error closing the server:', err);
            process.exit(1); // Thoát với mã lỗi
        } else {
            console.log('Server closed successfully.');
            process.exit(0); // Thoát thành công
        }
    });
};

// Bắt tín hiệu SIGINT (Ctrl+C)
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Bắt tín hiệu SIGTERM (kill)
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Xử lý sự kiện thoát
process.on('exit', (code) => {
    console.log(`Process exited with code: ${code}`);
});

// Ghi log bất kỳ lỗi không được bắt
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1); // Thoát tiến trình với lỗi
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1); // Thoát tiến trình với lỗi
});
