const redis = require('redis');

// Define status constants for connection
const statusConnectRedis = {
    CONNECT: 'connect',
    END: 'end',
    RECONNECT: 'reconnecting',
    ERROR: 'error'
};

// Declare the Redis client instance globally
let redisClient = null;

// Helper to handle Redis connection events
const handleEventConnection = (connectionRedis) => {
    connectionRedis.on(statusConnectRedis.CONNECT, () => {
        console.log('Redis connected');
    });

    connectionRedis.on(statusConnectRedis.END, () => {
        console.log('Redis disconnected');
    });

    connectionRedis.on(statusConnectRedis.RECONNECT, () => {
        console.log('Redis reconnecting');
    });

    connectionRedis.on(statusConnectRedis.ERROR, (err) => {
        console.error('Redis connection error', err);
    });
};

// Initialize Redis connection
const initRedis = () => {
    if (!redisClient) { // Check if Redis client is already initialized
        try {
            redisClient = redis.createClient({
                socket: {
                    host: 'localhost',  // Redis server address
                    port: 6379,         // Redis server port
                },
                password: '123456',  // Your Redis password (if any)
                retry_strategy: (options) => {
                    if (options.error) {
                        console.error('Redis connection error:', options.error);
                        if (options.error.code === 'ECONNREFUSED') {
                            return new Error('Redis server refused the connection');
                        }
                    }
                    return Math.min(options.attempt * 100, 5000); // Retry logic with backoff
                }
            });

            handleEventConnection(redisClient); // Handle Redis events

            // Connect Redis
            redisClient.connect()
                .then(() => {
                    console.log('Redis connection successful!');
                })
                .catch((err) => {
                    console.error('Failed to connect to Redis:', err);
                });

        } catch (err) {
            console.error('Redis initialization error:', err);
        }
    } else {
        console.log('Redis client already initialized.');
    }
};

// Return the Redis client instance for use in other parts of the app
const getRedis = () => {
    if (!redisClient) {
        throw new Error('Redis client is not initialized');
    }
    return redisClient;
};

// // Close Redis connection when needed (optional)
// const closeRedis = () => {
//     if (redisClient) {
//         redisClient.quit()
//             .then(() => {
//                 console.log('Redis connection closed.');
//             })
//             .catch((err) => {
//                 console.error('Error while closing Redis connection', err);
//             });
//     }
// };

module.exports = {
    initRedis,
    getRedis,
};
