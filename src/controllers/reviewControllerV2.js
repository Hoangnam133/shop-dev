const reviewServiceV2 = require('../services/reviewServiceV2')
const {SuccessResponse} = require('../core/successResponse')

class ReviewControllerV2 {
    createReview = async (req, res, next) => {
        new SuccessResponse({
            message: 'create review success',
            metaData: await reviewServiceV2.createReview({
                user: req.user,
                payload: req.body,
                order_id: req.params.order_id
            })
        }).send(res)
    }
    getReviewById = async (req, res, next) => {
        new SuccessResponse({
            message: 'get reviews success',
            metaData: await reviewServiceV2.getReviewById(req.params.review_id)
        }).send(res)
    }
    orderHasBeenReviewed = async (req, res, next) => {
        new SuccessResponse({
            message: 'order has been reviewed',
            metaData: await reviewServiceV2.orderHasBeenReviewed(req.user)
        }).send(res)
    }
    orderNotBeenReviewed = async (req, res, next) => {
        new SuccessResponse({
            message: 'order has been reviewed',
            metaData: await reviewServiceV2.orderNotBeenReviewed(req.user)
        }).send(res)
    }
}
module.exports = new ReviewControllerV2()