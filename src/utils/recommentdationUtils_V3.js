const natural = require('natural');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const { BadRequestError } = require('../core/errorResponse');
const { TfIdf } = natural;

// Tạo ma trận người dùng-sản phẩm (Collaborative Filtering)
const createUserProductMatrix = async () => {
    const orders = await Order.find({}, 'order_userId order_product.product_id');

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
    // Chuyển đổi các tham số thành Set nếu chúng không phải là Set hoặc mảng
    userA = convertToIterable(userA);
    userB = convertToIterable(userB);

    // Tính toán giao nhau giữa hai Set
    const intersectionSize = [...userA].filter(product => userB.has(product)).length;
    const magnitudeA = Math.sqrt(userA.size);  // Độ lớn của Set userA
    const magnitudeB = Math.sqrt(userB.size);  // Độ lớn của Set userB

    // Đảm bảo rằng độ lớn không phải là 0 để tránh chia cho 0
    return magnitudeA && magnitudeB ? intersectionSize / (magnitudeA * magnitudeB) : 0;
};

// Chuyển đổi các tham số đầu vào thành một iterable hợp lệ (Set hoặc mảng)
const convertToIterable = (obj) => {
    if (obj == null) return new Set();  // Trả về Set rỗng nếu obj là null hoặc undefined
    if (Array.isArray(obj)) return new Set(obj);  // Nếu là mảng, chuyển thành Set
    if (obj[Symbol.iterator]) return new Set(obj);  // Nếu là iterable, chuyển thành Set
    return new Set([obj]);  // Nếu không phải iterable, đặt nó trong Set
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

    if (!userId || !userProductMatrix[userId]) {
        throw new BadRequestError('User ID is required or invalid');
    }

    // Collaborative Filtering: Tính toán độ tương tự giữa người dùng
    const currentUserProducts = new Set(userProductMatrix[userId]);
    const similarityScores = [];
    const recommendedProducts = new Set();

    for (const [otherUserId, otherUserProducts] of Object.entries(userProductMatrix)) {
        if (otherUserId !== userId) {
            const otherUserProductSet = new Set(otherUserProducts);  // Đảm bảo rằng các sản phẩm của user khác là Set
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

    // Content-Based Filtering: Tính toán độ tương tự giữa sản phẩm
    const similarProducts = [];
    currentUserProducts.forEach(productId => {
        const productSimilarity = getProductSimilarity(productId, tfidf, products);
        similarProducts.push(...productSimilarity);
    });

    // Kết hợp cả hai phương pháp (Có thể điều chỉnh trọng số nếu cần)
    const combinedRecommendations = Array.from(recommendedProducts).concat(
        similarProducts.map(item => item.productId)
    );

    return [...new Set(combinedRecommendations)];
};

module.exports = { recommendProducts };
