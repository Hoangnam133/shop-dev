const redis = require('redis');
let client = {};
const statusConnectRedis = {
    CONNECT: 'connect',
    END: 'end',
    RECONNECT: 'reconnecting',
    ERROR: 'error'
};

// Hàm xử lý các sự kiện kết nối Redis
const handleEvenConnection = ({ connectionRedis }) => {
    connectionRedis.on(statusConnectRedis.CONNECT, () => {
        console.log(`connectionRedis-Connection status: connected`);
    });

    connectionRedis.on(statusConnectRedis.END, () => {
        console.log(`connectionRedis-Connection status: disconnected`);
    });

    connectionRedis.on(statusConnectRedis.RECONNECT, () => {
        console.log(`connectionRedis-Connection status: reconnecting`);
    });

    connectionRedis.on(statusConnectRedis.ERROR, (err) => {
        console.error(`connectionRedis-Connection status: error`, err);
    });
};

// Hàm khởi tạo Redis
const initRedis = () => {
    try {
        const instanceRedis = redis.createClient({
            socket: {
                host: 'localhost',  // Nếu bạn chạy Redis trên localhost
                port: 6379,         // Port mặc định của Redis
            },
            password: '123456',  // Thay đổi mật khẩu này
            retry_strategy: (options) => {
                if (options.error) {
                    console.error('Redis connection error:', options.error);
                    if (options.error.code === 'ECONNREFUSED') {
                        return new Error('Redis server refused the connection');
                    }
                }
                return Math.min(options.attempt * 100, 5000);
            }
        });

        client.instanceConnect = instanceRedis;

        handleEvenConnection({
            connectionRedis: instanceRedis
        });

        // Kết nối Redis
        instanceRedis.connect().catch(err => {
            console.error('Failed to connect to Redis:', err);
        });

    } catch (err) {
        console.error('Redis initialization error:', err);
    }
}

const getRedis = () => client;

const closeRedis = () => {
    if (client.instanceConnect) {
        client.instanceConnect.quit();
        console.log('Redis connection closed.');
    }
};

module.exports = {
    initRedis,
    getRedis,
    closeRedis
};
