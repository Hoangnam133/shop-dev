const redis = require('redis');
const redisClient = redis.createClient();
const cartModel = require('../models/cartModel')
const saveCartToRedis = (userId, cartData) => {
    redisClient.set(`cart_${userId}`, JSON.stringify(cartData), 'EX', 3600); 
}
const syncCartToDatabase = async (userId) => {
    const redisCartData = await redisClient.get(`cart_${userId}`);
    if (redisCartData) {
        const cart = JSON.parse(redisCartData);
        // Cập nhật hoặc lưu giỏ hàng vào MongoDB
        await cartModel.findOneAndUpdate({ cart_userId: userId }, cart, { upsert: true });
    }
};

const handleUserLogout = async (userId) => {
    const redisCartData = await redisClient.get(`cart_${userId}`);
    if (redisCartData) {
        // Đồng bộ dữ liệu giỏ hàng vào MongoDB trước khi xóa khỏi Redis
        const cartData = JSON.parse(redisCartData);
        await cartModel.findOneAndUpdate({ cart_userId: userId }, cartData, { upsert: true });
        await redisClient.del(`cart_${userId}`); // Xóa giỏ hàng khỏi Redis
    }
};