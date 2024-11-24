const reviewModel = require('../models/reviewModel')
const {BadRequestError, NotFoundError} = require('../core/errorResponse')
const productModel = require('../models/productModel')
const orderModel = require('../models/orderModel')
const {toObjectId} = require('../utils/index')
// dánh sách đơn hàng đã đánh giá
const orderHasBeenReviewed = async(user)=>{
    const orders = await orderModel.find({
        order_userId: user._id,
        order_status: 'completed'
    })
    if (!orders) {
        throw new NotFoundError("You don't have any orders yet")
    }
    const orderIds = orders.map(order=>order._id)
    const reviews = await reviewModel.find({
        review_order_id: { $in: orderIds },
        review_isDeleted: false
    }).sort({createdAt: -1})
    if (!reviews) {
        throw new NotFoundError("You don't have any reviews yet")
    }
    const hasBeenReviewed = await orderModel.find({
        order_userId: user._id,
        order_status: 'completed',
        _id: {$in: reviews.map(review=> review.review_order_id)}
    })
    return hasBeenReviewed
}
// danh sách đơn hàng chưa đánh giá
 const orderNotBeenReviewed = async(user)=>{
    const orders = await orderModel.find({
        order_userId: user._id,
        order_status: 'completed'
    })
    if (!orders) {
        throw new NotFoundError("You don't have any orders yet")
    }
    const orderIds = orders.map(order=>order._id)
    const reviews = await reviewModel.find({
        review_order_id: { $in: orderIds },
        review_isDeleted: false
    })
    if (reviews.length === orders.length) {
        throw new NotFoundError("You have already reviewed all your orders")
    }
    const notBeenReviewedOrderIds = orders.filter(order=>!reviews.some(review=>review.review_order_id.toString() === order._id.toString()))
    const notBeenReviewedOrders = await orderModel.find({
        _id: { $in: notBeenReviewedOrderIds },
        order_status: 'completed'
    }).sort({createdAt: -1})
    if (!notBeenReviewedOrders) {
        throw new NotFoundError("You don't have any orders that haven't been reviewed yet")
    }
    return notBeenReviewedOrders
}
// cập nhật đánh giá cho sản phẩm
const updateRatingProduct = async ({ product_id, rating }) => {
  
    const foundProduct = await productModel.findById(product_id);
    

    if (!foundProduct) {
        throw new NotFoundError("Product not found");
    }

    const oldRating = foundProduct.product_ratingAverage;
    const oldCountRating = foundProduct.review_count;

    if (isNaN(rating) || rating < 1 || rating > 5) {
        throw new BadRequestError("Rating must be a number between 1 and 5");
    }

    if (isNaN(oldCountRating)) {
        throw new Error("Invalid review count value");
    }

    const newCountRating = oldCountRating + 1;
    const newRating = (oldRating * oldCountRating + rating) / newCountRating;

    const updateProduct = await productModel.findByIdAndUpdate(product_id, {
        $set: {
            product_ratingAverage: Math.round(newRating * 10) / 10, 
            review_count: newCountRating 
        }
    }, { new: true }); 

    if (!updateProduct) {
        throw new BadRequestError("Failed to update product");
    }

    return updateProduct;
};

const getReviewById = async(review_id) => {
    const findReview = await reviewModel.findById(review_id)
    if (!findReview) {
        throw new NotFoundError("Review not found")
    }
    return findReview
}
// tạo đánh giá
const createReview = async({payload, order_id, user})=>{
    const orders = await orderModel.findOne({
        order_userId: user._id,
        order_status: 'completed',
        _id: order_id
    })
    if (!orders) {
        throw new NotFoundError("Order not found")
    }
    const productIds = orders.order_product.map(item => item.product_id)
    const createReview = await reviewModel.create({
        review_content: payload.review_content,
        review_rating: payload.review_rating,
        review_order_id: order_id,
        review_isDeleted: false
    })
    if (createReview) {
       for(let product of productIds){
            console.log("id sản phẩm là ", product)
            const updateProduct = await updateRatingProduct({product_id: product, rating: payload.review_rating})
            if (!updateProduct) {
               await reviewModel.findByIdAndDelete(createReview._id)
               break
            }
       }
    }
    else{
        throw new BadRequestError("Failed to create review")
    }
    return createReview
}
module.exports = {
    orderHasBeenReviewed,
    orderNotBeenReviewed,
    createReview,
    getReviewById
}

