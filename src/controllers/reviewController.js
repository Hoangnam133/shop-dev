const reviewService = require('../services/reviewService')

const { SuccessResponse } = require('../core/successResponse')

class ReviewController {
    createReview = async (req, res, next) => {
        new SuccessResponse({
            message: 'create review success',
            metaData: await reviewService.createReviewOrder({
                user: req.user,
                body: req.body
            })
        }).send(res)
    }
    getReviewsByProductId = async (req, res, next) => {
        new SuccessResponse({
            message: 'get reviews success',
            metaData: await reviewService.getReviewsByProductId({
                product_id: req.params.product_id
            })
        }).send(res)
    }
    updateReview = async (req, res, next) => {
        new SuccessResponse({
            message: 'update review success',
            metaData: await reviewService.updateReview({
                user: req.user,
                review_id: req.params.review_id,
                dataUpdate: req.body
            })
        }).send(res)
    }
    getReviewsByRating = async (req, res, next) => {
        new SuccessResponse({
            message: 'get reviews success',
            metaData: await reviewService.getReviewsByRating(req.query)
        }).send(res)
    }
    getReviewsSortedByRating = async (req, res, next) => {
        new SuccessResponse({
            message: 'get reviews success',
            metaData: await reviewService.getReviewsSortedByRating(req.query)
        }).send(res)
    }
    orderProductIsNotReview = async (req, res, next) => {
        new SuccessResponse({
            message: 'order product is not review',
            metaData: await reviewService.orderProductIsNotReview({
                user: req.user,
                ...req.query
            })
        }).send(res)
    }
    getReviewByUser = async (req, res, next) => {
        new SuccessResponse({
            message: 'get review success',
            metaData: await reviewService.getReviewByUser({
                user: req.user
            })
        }).send(res)
    }
}
module.exports = new ReviewController()