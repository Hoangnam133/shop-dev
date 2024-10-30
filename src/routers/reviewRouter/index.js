const express = require('express')
const {authentication, authorizeRoles} = require('../../auth/authUtils')
const router = express.Router()

const reviewController = require('../../controllers/reviewController')
const { asynHandler } = require('../../utils/handler')
router.get('/getAllReviewOfProduct/:product_id', asynHandler(reviewController.getReviewsByProductId))
router.get('/getReviewWithRate', asynHandler(reviewController.getReviewsByRating))
router.get('/getReviewsSortedByRating', asynHandler(reviewController.getReviewsSortedByRating))
router.use(authentication)
router.get('/getOrderProductNotReview', asynHandler(reviewController.orderProductIsNotReview))
router.get('/getReviewByUser', asynHandler(reviewController.getReviewByUser))
router.post('/create', asynHandler(reviewController.createReview))
router.patch('/update/:review_id', asynHandler(reviewController.updateReview))
module.exports = router
