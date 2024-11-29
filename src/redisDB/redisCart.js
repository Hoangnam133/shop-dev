const { getRedis } = require('./initRedis_docker');
const { NotFoundError } = require('../core/errorResponse');  // Assuming NotFoundError is defined in your project
const cartModel = require('../models/cartModel'); // Your cart model file

// Cart-related Redis functions
const saveCartToRedis = (userId, cartData) => {
  const redisClient = getRedis(); // Get Redis client instance
  redisClient.set(`cart_${userId}`, JSON.stringify(cartData), 'EX', 3600); 
};

const syncCartToDatabase = async (userId) => {
    const redisClient = getRedis(); // Get Redis client instance
    const redisCartData = await redisClient.get(`cart_${userId}`);
    if (redisCartData) {
        const cart = JSON.parse(redisCartData);
        // Update or save the cart in MongoDB
        await cartModel.findOneAndUpdate({ cart_userId: userId }, cart, { upsert: true });
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

const getCartRedis = async (user) => {
    const redisClient = getRedis(); // Get Redis client instance
    const cartKey = `cart:${user._id}`;
    try {
        const cart = await redisClient.hGetAll(cartKey);
        if (!cart) throw new NotFoundError('Cart not found');
        return cart; // Return the user's full cart
    } catch (err) {
        throw new NotFoundError('Cart not found');
    }
};

const removeProductFromCartRedis = async ({ user, product }) => {
    const redisClient = getRedis(); // Get Redis client instance
    const cartKey = `cart:${user._id}`;
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

module.exports = {
    saveCartToRedis,
    syncCartToDatabase,
    handleUserLogout,
    getCartRedis,
    removeProductFromCartRedis
};
