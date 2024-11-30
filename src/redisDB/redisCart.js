const { getRedis } = require('./initRedis_docker');
const { NotFoundError } = require('../core/errorResponse');  // Assuming NotFoundError is defined in your project
const cartModel = require('../models/cartModel'); // Your cart model file

// Cart-related Redis functions
const saveCartToRedis = async (userId, cartData) => {
  const redisClient = getRedis(); // Get Redis client instance
  redisClient.set(`cart_${userId}`, JSON.stringify(cartData), 'EX', 3600); 
};
const syncCartToDatabase = async (userId, cartData) => {
    try {
        await cartModel.findOneAndUpdate({ cart_userId: userId }, cartData, { upsert: true });
        console.log(`Cart for user ${userId} synced to database`);
        const redisClient = getRedis();
        await redisClient.del(`cart_${userId}`);
    } catch (error) {
        console.error(`Error syncing cart for user ${userId}:`, error);
    }
};
const syncAllCartsToDatabase = async () => {
    const redisClient = getRedis();
    try {
        const keys = await redisClient.keys('cart_*'); // Lấy tất cả các keys có dạng 'cart_*'
        
        // Đồng bộ tất cả giỏ hàng từ Redis vào MongoDB
        for (const key of keys) {
            const userId = key.split('_')[1]; // Lấy userId từ key
            const redisCartData = await redisClient.get(key); // Lấy dữ liệu giỏ hàng từ Redis
            if (redisCartData) {
                const cart = JSON.parse(redisCartData);
                await syncCartToDatabase(userId, cart); // Đồng bộ giỏ hàng vào MongoDB
            }
        }
        console.log('All carts synced to database');
    } catch (err) {
        console.error('Error syncing carts to database:', err);
    }
};

const handleUserLogout = async (userId) => {
    const redisClient = getRedis(); // Get Redis client instance
    const redisCartData = await redisClient.get(`cart_${userId}`);
    if (redisCartData) {
        // Sync cart data to MongoDB before deleting from Redis
        const cartData = JSON.parse(redisCartData);
        await cartModel.findOneAndUpdate({ cart_userId: userId }, cartData, { upsert: true });
        await redisClient.del(`cart_${userId}`); // Delete cart from Redis
    }
};

const getCartRedis = async (userId) => {
    const redisClient = getRedis(); // Get Redis client instance
    const cartKey = `cart_${userId}`;
    try {
        const cart = await redisClient.get(cartKey);
        console.log("TÌM THẤY TRONG REDIS",JSON.parse(cart))
        return cart ? JSON.parse(cart) : null
    } catch (err) {
        console.error(err);
    }
};

const removeProductFromCartRedis = async ({ userId, product }) => {
    const redisClient = getRedis(); // Get Redis client instance
    const cartKey = `cart:${userId}`;
    const { product_id, sideDish_ids = [] } = product;
    const uniqueKey = `${product_id}-${sideDish_ids.sort().join('-')}`;
  
    try {
        const response = await redisClient.hDel(cartKey, uniqueKey);
        if (response === 0) throw new NotFoundError('Product not found in cart');
        return { message: 'Product removed from cart successfully!' };
    } catch (err) {
        throw new NotFoundError('Product not found in cart');
    }
};


const autoSyncCartBeforeExpire = () => {
    const redisClient = getRedis();
    redisClient.keys('cart_*', async (err, keys) => {
        if (err) throw err;
        
        for (const key of keys) {
            const userId = key.split('_')[1];
            const redisCartData = await redisClient.get(key);
            if (redisCartData) {
                const cart = JSON.parse(redisCartData);
                await cartModel.findOneAndUpdate({ cart_userId: userId }, cart, { upsert: true });
            }
        }
    });
};

// setInterval(autoSyncCartBeforeExpire, 30 * 60 * 1000);

module.exports = {
    saveCartToRedis,
    handleUserLogout,
    getCartRedis,
    removeProductFromCartRedis,
    syncAllCartsToDatabase
};
