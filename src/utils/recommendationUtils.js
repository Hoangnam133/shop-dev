const Order = require('../models/orderModel');
const { BadRequestError } = require('../core/errorResponse');

// Tạo ma trận người dùng-sản phẩm
const createUserProductMatrix = async () => {
    const orders = await Order.find().populate('order_product.product_id');
    console.log('Orders:', orders); // Kiểm tra dữ liệu đơn hàng

    const userProductMatrix = {};

    orders.forEach(order => {
        const userId = order.order_userId;
        userProductMatrix[userId] = userProductMatrix[userId] || [];

        order.order_product.forEach(product => {
            if (product.product_id && product.product_id._id) {
                userProductMatrix[userId].push(product.product_id._id);
            }
        });
    });

    console.log('User Product Matrix:', userProductMatrix); // Kiểm tra ma trận người dùng-sản phẩm

    return userProductMatrix;
};

// Tính độ tương tự Cosine
const cosineSimilarity = (userA, userB) => {
    console.log('User A Products:', userA); // Kiểm tra sản phẩm của người dùng A
    console.log('User B Products:', userB); // Kiểm tra sản phẩm của người dùng B

    const setA = new Set(userA);
    const setB = new Set(userB);

    const intersection = [...setA].filter(product => setB.has(product)).length;
    const magnitudeA = Math.sqrt(setA.size);
    const magnitudeB = Math.sqrt(setB.size);

    console.log('Intersection:', intersection); // Kiểm tra độ giao nhau
    console.log('Magnitude A:', magnitudeA); // Kiểm tra độ lớn của A
    console.log('Magnitude B:', magnitudeB); // Kiểm tra độ lớn của B

    return intersection / (magnitudeA * magnitudeB);
};

// Đề xuất các món ăn cho người dùng
const recommendProducts = async (userId, userProductMatrix) => {
    if (!userId) {
        throw new BadRequestError('User ID is required');
    }

    console.log('User ID:', userId); // Kiểm tra userId

    const similarityScores = {};
    const currentUserProducts = userProductMatrix[userId];

    console.log('Current User Products:', currentUserProducts); // Kiểm tra sản phẩm của người dùng hiện tại

    for (const otherUserId in userProductMatrix) {
        if (otherUserId !== userId) {
            const otherUserProducts = userProductMatrix[otherUserId];
            const similarity = cosineSimilarity(currentUserProducts, otherUserProducts);
            similarityScores[otherUserId] = similarity;
            console.log('Similarity between', userId, 'and', otherUserId, ':', similarity); // Kiểm tra độ tương tự giữa người dùng
        }
    }

    const similarUsers = Object.entries(similarityScores).sort((a, b) => b[1] - a[1]);

    console.log('Similar Users:', similarUsers); // Kiểm tra danh sách người dùng tương tự

    const recommendedProducts = new Set();

    for (const [similarUserId, similarity] of similarUsers) {
        if (similarity > 0) {
            const similarUserProducts = userProductMatrix[similarUserId];
            similarUserProducts.forEach(productId => {
                if (!currentUserProducts.includes(productId)) {
                    recommendedProducts.add(productId);
                }
            });
        }
    }

    console.log('Recommended Products:', Array.from(recommendedProducts)); // In các sản phẩm được đề xuất

    return Array.from(recommendedProducts);
};

module.exports = { createUserProductMatrix, recommendProducts };
