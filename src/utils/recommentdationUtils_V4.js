const natural = require('natural');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const { BadRequestError } = require('../core/errorResponse');
const { TfIdf } = natural;

// Tạo ma trận người dùng-sản phẩm (Collaborative Filtering)
const createUserProductMatrix = async () => {
    const orders = await Order.find({}, 'order_userId order_product.product_id').limit(100).sort({CreateAt: -1})

    const userProductMatrix = new Map();
    orders.forEach(order => {
        const userId = order.order_userId.toString();
        if (!userProductMatrix.has(userId)) {
            userProductMatrix.set(userId, new Set());
        }
        order.order_product.forEach(product => {
            if (product.product_id) {
                userProductMatrix.get(userId).add(product.product_id.toString());
            }
        });
    });

    return Object.fromEntries(userProductMatrix);
};

// Tính độ tương tự Cosine (Collaborative Filtering)
const cosineSimilarity = (userA, userB) => {
    userA = convertToIterable(userA);
    userB = convertToIterable(userB);

    const intersectionSize = [...userA].filter(product => userB.has(product)).length;
    const magnitudeA = Math.sqrt(userA.size); 
    const magnitudeB = Math.sqrt(userB.size);

    return magnitudeA && magnitudeB ? intersectionSize / (magnitudeA * magnitudeB) : 0;
};

// Chuyển đổi các tham số đầu vào thành một iterable hợp lệ (Set hoặc mảng)
const convertToIterable = (obj) => {
    if (obj == null) return new Set();
    if (Array.isArray(obj)) return new Set(obj);
    if (obj[Symbol.iterator]) return new Set(obj);
    return new Set([obj]);
};

// Tạo ma trận sản phẩm (Content-Based Filtering)
const createProductContentMatrix = async () => {
    const products = await Product.find({}, 'product_name product_description ingredients');

    const tfidf = new TfIdf();
    products.forEach(product => {
        const content = `${product.product_name} ${product.product_description} ${product.ingredients}`;
        tfidf.addDocument(content);
    });

    return { products, tfidf };
};

// Tính độ tương tự Cosine giữa các sản phẩm (Content-Based Filtering)
const getProductSimilarity = (productId, tfidf, products) => {
    const productIdx = products.findIndex(product => product._id.toString() === productId);
    const productVector = tfidf.documents[productIdx];

    const similarities = [];

    tfidf.documents.forEach((docVector, idx) => {
        if (idx !== productIdx) {
            const similarity = cosineSimilarity(productVector, docVector);
            similarities.push({ productId: products[idx]._id, similarity });
        }
    });

    return similarities.sort((a, b) => b.similarity - a.similarity);
};

// Đề xuất sản phẩm (Kết hợp Collaborative Filtering và Content-Based Filtering)
const recommendProducts = async (userId) => {
    const userProductMatrix = await createUserProductMatrix();
    const { products, tfidf } = await createProductContentMatrix();

    if (!userId) {
        throw new BadRequestError('User ID is required or invalid');
    }

    // Kiểm tra xem người dùng có sản phẩm nào đã mua chưa
    const currentUserProducts = userProductMatrix[userId] ? new Set(userProductMatrix[userId]) : new Set();

    if (currentUserProducts.size === 0) {
        // Nếu người dùng chưa có đơn hàng, chỉ sử dụng Content-Based Filtering
        const recommendedProducts = [];

        // Đề xuất các sản phẩm dựa trên độ tương tự nội dung
        products.forEach(product => {
            const productSimilarity = getProductSimilarity(product._id.toString(), tfidf, products);
            recommendedProducts.push(...productSimilarity);
        });

        // Trả về danh sách các sản phẩm đề xuất dựa trên Content-Based Filtering
        return recommendedProducts.slice(0, 10).map(item => item.productId.toString());
    }

    // Collaborative Filtering: Tính toán độ tương tự giữa người dùng
    const similarityScores = [];
    const recommendedProducts = new Set();

    for (const [otherUserId, otherUserProducts] of Object.entries(userProductMatrix)) {
        if (otherUserId !== userId) {
            const otherUserProductSet = new Set(otherUserProducts);
            const similarity = cosineSimilarity(currentUserProducts, otherUserProductSet);
            if (similarity > 0) {
                similarityScores.push([otherUserId, similarity]);
            }
        }
    }

    similarityScores.sort((a, b) => b[1] - a[1]);

    for (const [similarUserId] of similarityScores) {
        userProductMatrix[similarUserId].forEach(productId => {
            if (!currentUserProducts.has(productId)) {
                recommendedProducts.add(productId);
            }
        });
    }

    // Kết hợp cả hai phương pháp (Collaborative + Content-Based)
    const combinedRecommendations = Array.from(recommendedProducts);

    // Nếu muốn kết hợp với Content-Based (tăng cường), có thể thêm vào danh sách
    return combinedRecommendations.concat(
        products.map(product => product._id.toString())
    ).slice(0, 10);
};

module.exports = { recommendProducts };
