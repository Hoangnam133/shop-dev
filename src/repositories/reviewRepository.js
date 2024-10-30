const reviewModel = require('../models/reviewModel')
const {BadRequestError, NotFoundError} = require('../core/errorResponse')
const {removeUndefinedObject} = require('../utils/index')
const productModel = require('../models/productModel')
const orderModel = require('../models/orderModel')
const {unGetSelectListData, getSelectListData} = require('../utils/index')
const createReview = async({ user, body }) => {
    if (!user) throw new BadRequestError('User not found')
    const { review_order_id, review_product_id, review_rating, review_comment, review_img_1, review_img_2 } = body
    const findProduct = await productModel.findById(review_product_id)
    if (!findProduct) throw new BadRequestError('Product not found')
    const check_ProductInOrder = await checkProductInOrder({
        productId: review_product_id,
        orderId: review_order_id,
        user: user})
    if(!check_ProductInOrder){
        throw new BadRequestError('Product not in order')
    }
    const check_ProductHasBeenReview = await checkProductHasBeenReview({ productId: review_product_id, orderId: review_order_id })
    if(check_ProductHasBeenReview){
        throw new BadRequestError('Product has already been reviewed')
    }
    const newReview = await reviewModel.create({
        review_order_id,
        review_product_id,
        review_rating,
        review_comment,
        review_img_1,
        review_img_2
    })
    const updatedAverageRating = ((findProduct.product_ratingAverage * findProduct.review_count + review_rating) / (findProduct.review_count + 1))
    const filter = {
        _id: newReview.review_product_id
    },
    update_data={
        $inc: { review_count: 1 },
        $set:{
            product_ratingAverage:  Math.round(updatedAverageRating * 10) / 10
        }
    },
    options = {
        new: true,
        lean: true
    }
    if (!newReview) throw new BadRequestError('Failed to create review')
    const updateProduct = await productModel.findByIdAndUpdate(filter, update_data, options)
    if(!updateProduct) throw new BadRequestError('Failed to update product')
    return newReview
}
const checkProductHasBeenReview = async ({ productId, orderId }) => {
    const findReview = await reviewModel.findOne({ review_order_id: orderId, review_product_id: productId })
    return findReview? true : false
}
const checkProductReviewInOrder = async ({ productId, orderId, user }) => {
    const findOrder = await orderModel.findOne({ _id: orderId, order_userId: user._id })
    if (!findOrder) throw new NotFoundError('Order not found')
    const findReview = await reviewModel.findOne({ review_order_id: orderId, review_product_id: productId, review_isDeleted: false })
    return findReview? true : false
}
const checkProductInOrder = async ({ productId, orderId, user }) => {
    const findOrder = await orderModel.findOne({ _id: orderId, order_userId: user._id })
    if (!findOrder) throw new NotFoundError('Order not found')

    const findProduct = await productModel.findById(productId)
    if (!findProduct) throw new NotFoundError('Product not found')

    const findOrderProduct = findOrder.order_product.some(product=> product.productId.toString() === findProduct._id.toString())
    if (!findOrderProduct) throw new NotFoundError('Product not found in the order')
    
    return findOrderProduct
}
const updateReview = async ({ dataUpdate, review_id, user }) => {
    const findReview = await reviewModel.findById(review_id)
    if (!findReview) throw new NotFoundError('Review not found')
    const isReviewInOrder = await checkProductReviewInOrder({productId: findReview.review_product_id, orderId: findReview.review_order_id, user: user  })
    if(!isReviewInOrder){
        throw new BadRequestError('You cannot update this review because it is in the order')
    }
    let processedData = removeUndefinedObject(dataUpdate)
    const oldReviewRating = findReview.review_rating
    const { review_rating } = dataUpdate
    const options = { new: true, lean: true }
    let updateReviewResult
    if (review_rating && review_rating !== oldReviewRating) {
        const findProduct = await productModel.findById(findReview.review_product_id)
        if (!findProduct) throw new BadRequestError('Product not found')
        const updatedAverageRating = (
            (findProduct.product_ratingAverage * findProduct.review_count + review_rating - oldReviewRating) /
            findProduct.review_count
        )
        const filter = { _id: findReview.review_product_id }
        const updateData = {
            $set: {
                product_ratingAverage: Math.round(updatedAverageRating * 10) / 10
            }
        }
        updateReviewResult = await reviewModel.findByIdAndUpdate(review_id, processedData, options)
        if (!updateReviewResult) throw new BadRequestError('Failed to update review')
        const updateProduct = await productModel.findByIdAndUpdate(filter, updateData, options)
        if (!updateProduct) throw new BadRequestError('Failed to update product')

    } else {
        updateReviewResult = await reviewModel.findByIdAndUpdate(review_id, processedData, options)
        if (!updateReviewResult) throw new BadRequestError('Failed to update review')
    }
    return updateReviewResult
}
const getReviewByUser = async({user, limit = 10, page = 1})=>{
    const orders = await orderModel.find({
        order_userId: user._id
    })
    const reviews = await reviewModel.find({
        review_order_id: {
            $in: orders.map(order => order._id)
        }
    }).populate({
        path: 'review_product_id',
        select: 'product_name product_thumb'
    })
    if(!reviews.length){
        return null
    }
    return reviews
}
const getReviewsByProductId = async ({product_id, page = 1, limit = 10}) => {
    const findProduct = await productModel.findById(product_id)
    if (!findProduct) throw new BadRequestError('Product not found')
    const skip = (page - 1) * limit
    const reviews = await reviewModel.find({review_product_id: product_id, review_isDeleted: false  })
    .skip(skip)
    .limit(limit)
    .lean()
    .populate({
        path: 'review_product_id',
        select: 'product_name product_thumb'
    })
    return reviews
}
 const getReviewById = async (reviewId) => {
    const review = await reviewModel.findById(reviewId).populate({
        path: 'review_product_id',
        select: 'product_name product_thumb'
    })
    if (!review) throw new BadRequestError('Review not found')
    return review
}
const getReviewsByRating = async ({ product_id, rating, page = 1, limit = 10 }) => {
    const findProduct = await productModel.findById(product_id)
    if (!findProduct) throw new BadRequestError('Product not found')
    const skip = (page - 1) * limit
    const reviews = await reviewModel.find({ review_product_id: product_id, review_rating: rating, review_isDeleted: false })
        .skip(skip)
        .limit(limit)
        .lean().populate({
            path: 'review_product_id',
            select: 'product_name product_thumb'
        })
    return reviews
}
const listProductIsNotReview = async (userId) => {
    const orders = await orderModel.find({ order_userId: userId, order_status: 'Completed' }).lean()
    const reviews = await reviewModel.find({ 
        review_order_id: { $in: orders.map(order => order._id) }
    }).lean()
    const reviewedProductMap = {}
    reviews.forEach(({ review_order_id, review_product_id }) => {
        const orderId = review_order_id.toString()
        const productId = review_product_id.toString()
        if (!reviewedProductMap[orderId]) {
            reviewedProductMap[orderId] = new Set()
        }
        reviewedProductMap[orderId].add(productId)
    })
    const product_ids = orders.flatMap(order => 
        order.order_product.filter(({ productId }) => 
            !(reviewedProductMap[order._id.toString()]?.has(productId.toString()))
        ).map(({ productId }) => ({
            orderId: order._id.toString(),
            productId: productId.toString()
        }))
    )
    product_ids.forEach(product_id => {
        console.log(product_id)
    })
    return product_ids
}
// const orderProductIsNotReview = async ({ userId, limit, page }) => {
//     const skip = (page - 1) * limit

//     const notReviewed = await listProductIsNotReview(userId)
//     const orders = await orderModel.find({ order_userId: userId, order_status: 'Completed'}).lean()
//     const filteredOrders = orders.map(order => {
//         const updatedOrderProducts = order.order_product.filter(product =>
//             notReviewed.some(nr => nr.orderId === order._id.toString() && nr.productId === product.productId.toString())
//         )
//         if (updatedOrderProducts.length > 0) {
//             return {
//                 ...order,
//                 order_product: updatedOrderProducts
//             }
//         }
//         return null; 
//     }).filter(order => order !== null)
//     return filteredOrders.slice(skip, skip + limit);
// }
const orderProductIsNotReview = async ({ userId, limit, page }) => { 
    const skip = (page - 1) * limit;

    const notReviewed = await listProductIsNotReview(userId);
    const orders = await orderModel.find({ order_userId: userId, order_status: 'Completed' }).lean();

    const filteredOrders = await Promise.all(orders.map(async order => {
        const updatedOrderProducts = order.order_product.filter(product =>
            notReviewed.some(nr => nr.orderId === order._id.toString() && nr.productId === product.productId.toString())
        );

        if (updatedOrderProducts.length > 0) {
            // Lấy thông tin sản phẩm
            const populatedProducts = await Promise.all(updatedOrderProducts.map(async (product) => {
                const populatedProduct = await productModel.findById(product.productId).select('product_name product_thumb');
                if (populatedProduct) {
                    return {
                        ...product,
                        product_name: populatedProduct.product_name,
                        product_thumb: populatedProduct.product_thumb,
                    };
                }
                return {
                    ...product,
                    product_name: null, // Nếu không tìm thấy sản phẩm
                    product_thumb: null,
                };
            }));

            return {
                ...order,
                order_product: populatedProducts
            };
        }
        return null; 
    }));

    // Lọc ra các đơn hàng không null
    const validOrders = filteredOrders.filter(order => order !== null);
    return validOrders.slice(skip, skip + limit);
};

const getReviewsSortedByRating = async ({ product_id, sortOrder = 'asc', page = 1, limit = 10 }) => {
    const findProduct = await productModel.findById(product_id)
    if (!findProduct) throw new BadRequestError('Product not found')
    const skip = (page - 1) * limit
    const sort = sortOrder === 'asc' ? 1 : -1
    const reviews = await reviewModel.find({ review_product_id: product_id, review_isDeleted: false  })
        .skip(skip)
        .limit(limit)
        .sort({ review_rating: sort })
        .lean()
    return reviews
}
const hidenReviewById = async (review_id) => {
    const review = await reviewModel.findByIdAndUpdate({
        _id: review_id
    },{
        review_isDeleted: true
    },{
        new: true,
        lean: true
    })
    if(!review) throw new NotFoundError('delete Review failed')
        
    return review
    
}
module.exports = {
    createReview,
    updateReview,
    getReviewsByProductId,
    getReviewById,
    getReviewsByRating,
    getReviewsSortedByRating,
    orderProductIsNotReview,
    hidenReviewById,
    getReviewByUser
}