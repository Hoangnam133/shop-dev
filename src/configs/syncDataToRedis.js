// syncData.js
const productModel = require('../models/productModel'); // Đường dẫn đến tệp productModel.js
const { getRedis } = require('./initRedis'); // Đường dẫn đến tệp redis-connection.js

const syncProductsToRedis = async () => {
    try {
        const products = await productModel.find();
        const client = getRedis().instanceConnect;

        for (const product of products) {
            await client.hSet(`product:${product._id}`, {
                product_name: product.product_name,
                product_thumb: product.product_thumb,
                product_description: product.product_description,
                product_price: product.product_price,
                ingredients: product.ingredients,
                serving_size: product.serving_size,
                preparation_time: product.preparation_time,
                product_usage: product.product_usage,
            });
        }
        console.log(`Successfully synced ${products.length} products to Redis.`);
    } catch (err) {
        console.error('Error syncing products to Redis:', err);
    }
}

module.exports = {
    syncProductsToRedis
}
