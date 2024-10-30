const {createReview, getReviewById, getReviewsByProductId,
    getReviewByUser, getReviewsByRating, getReviewsSortedByRating, orderProductIsNotReview, updateReview} = require('../repositories/reviewRepository')
class ReviewService {
    static async createReviewOrder({user,body}) {
        return await createReview({user,body})
    }
    static async getReviewsByProductId({product_id, limit = 10, page = 1}) {
        return await getReviewsByProductId({ product_id, limit, page })
    }
    static async getReviewById(reviewId) {
        return await getReviewById(reviewId)
    }
    static async updateReview({review_id, dataUpdate, user}) {
        return await updateReview({ review_id, dataUpdate, user })
    }
    static async getReviewsByRating({ product_id, rating, page = 1, limit = 10 }) {
        return await getReviewsByRating({ product_id, rating, page, limit })
    }
    static async getReviewsSortedByRating({ product_id, sortOrder = 'asc', page = 1, limit = 10 }) {
        return await getReviewsSortedByRating({ product_id, sortOrder, page, limit })
    }
    static async orderProductIsNotReview({user, limit = 10, page = 1  }) {
        return await orderProductIsNotReview({userId: user._id, limit, page  })
    }
    static async getReviewByUser({user, limit = 10, page = 1}) {
        return await getReviewByUser({user, limit, page })
    }
}
module.exports = ReviewService