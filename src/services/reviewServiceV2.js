const {orderHasBeenReviewed,
    orderNotBeenReviewed,
    createReview,
    getReviewById} = require('../repositories/reviewRepositoryV2')

class ReviewServiceV2 {
    static async orderHasBeenReviewed(user) {
        return await orderHasBeenReviewed(user)
    }
    static async orderNotBeenReviewed(user) {
        return await orderNotBeenReviewed(user)
    }
    static async createReview({payload, order_id, user}) {
        return await createReview({payload, order_id, user})
    }
    static async getReviewById(review_id) {
        return await getReviewById(review_id)
    }
}

module.exports = ReviewServiceV2