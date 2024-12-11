const express = require('express')
const {authentication, authorizeRoles} = require('../../auth/authUtils')
const router = express.Router()
const reviewControllerV2 = require('../../controllers/reviewControllerV2')
const { asynHandler } = require('../../utils/handler')

router.use(authentication)
router.post('/create/:order_id', asynHandler(reviewControllerV2.createReview))
router.get('/orderNotBeenReviewed', asynHandler(reviewControllerV2.orderNotBeenReviewed))
router.get('/orderHasBeenReviewed', asynHandler(reviewControllerV2.orderHasBeenReviewed))
router.get('/getReviewById/:review_id', asynHandler(reviewControllerV2.getReviewById))
router.get('/listReviews', asynHandler(reviewControllerV2.listReviews))




module.exports = router
