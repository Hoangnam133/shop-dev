const natural = require('natural');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const { BadRequestError } = require('../core/errorResponse');
const { TfIdf } = natural;

// Tạo ma trận người dùng-sản phẩm (Collaborative Filtering)
const createUserProductMatrix = async () => {
    const orders = await Order.find({}, 'order_userId order_product.product_id')
        .lean()
        .limit(100)
        .sort({ createdAt: -1 });

    const userProductMatrix = {};
    for (const order of orders) {
        const userId = order.order_userId.toString();
        if (!userProductMatrix[userId]) {
            userProductMatrix[userId] = new Set();
        }
        for (const product of order.order_product) {
            if (product.product_id) {
                userProductMatrix[userId].add(product.product_id.toString());
            }
        }
    }
    return userProductMatrix;
};

// Tính độ tương tự Cosine (Collaborative Filtering)
const cosineSimilarity = (setA, setB) => {
    const intersectionSize = [...setA].filter(item => setB.has(item)).length;
    const magnitude = Math.sqrt(setA.size) * Math.sqrt(setB.size);
    return magnitude ? intersectionSize / magnitude : 0;
};

// Tạo ma trận sản phẩm (Content-Based Filtering)
const createProductContentMatrix = async () => {
    const products = await Product.find({}, 'product_name product_description ingredients').lean();

    const tfidf = new TfIdf();
    products.forEach(product => {
        const content = `${product.product_name} ${product.product_description || ''} ${product.ingredients || ''}`;
        tfidf.addDocument(content);
    });

    return { products, tfidf };
};

// Đề xuất sản phẩm (Kết hợp Collaborative Filtering và Content-Based Filtering)
const recommendProducts = async (userId) => {
    const userProductMatrix = await createUserProductMatrix();
    const { products, tfidf } = await createProductContentMatrix();

    if (!userId) {
        throw new BadRequestError('User ID is required or invalid');
    }

    const currentUserProducts = new Set(userProductMatrix[userId] || []);

    // Nếu người dùng chưa mua gì, chỉ dùng Content-Based Filtering
    if (currentUserProducts.size === 0) {
        return products
            .map(product => product._id.toString())
            .slice(0, 10);
    }

    // Collaborative Filtering
    const recommendedProducts = new Set();
    for (const [otherUserId, otherUserProducts] of Object.entries(userProductMatrix)) {
        if (otherUserId !== userId) {
            const similarity = cosineSimilarity(currentUserProducts, otherUserProducts);
            if (similarity > 0) {
                for (const productId of otherUserProducts) {
                    if (!currentUserProducts.has(productId)) {
                        recommendedProducts.add(productId);
                    }
                }
            }
        }
    }

    // Kết hợp cả hai phương pháp
    const combinedRecommendations = [...recommendedProducts].concat(
        products.map(product => product._id.toString())
    );

    return combinedRecommendations.slice(0, 10);
};

module.exports = { recommendProducts };
