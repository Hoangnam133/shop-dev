const express = require('express')
const {authentication, authorizeRoles} = require('../../auth/authUtils')
const router = express.Router()

const orderController = require('../../controllers/orderController')

const { asynHandler } = require('../../utils/handler')

router.use(authentication)
// USER
router.post('/checkoutReview',asynHandler(orderController.checkoutReview))
router.post('/checkOutByUser',asynHandler(orderController.checkOutByUser))
router.post('/handlePaymentCallback',asynHandler(orderController.handlePaymentCallback))

router.get('/listOrderCancelledOfUser',asynHandler(orderController.listOrderCancelledOfUser))
router.get('/listOrderCompletedOfUser',asynHandler(orderController.listOrderCompletedOfUser))
router.get('/listOrderPendingOfUser',asynHandler(orderController.listOrderPendingOfUser))
router.get('/listOrderSuccessOfUser',asynHandler(orderController.listOrderSuccessOfUser))


// ADMIN
router.use(authorizeRoles('ADMIN'))
router.patch('/updateStatusCompleted/:order_id',asynHandler(orderController.updateStatusCompleted))
router.get('/listOrderPending',asynHandler(orderController.listOrderPending))
router.get('/listOrderCompleted',asynHandler(orderController.listOrderCompleted))
router.get('/listOrderCancelled',asynHandler(orderController.listOrderCancelled))
router.get('/listOrderSuccess',asynHandler(orderController.listOrderSuccess))


module.exports = router
