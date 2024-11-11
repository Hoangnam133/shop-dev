const express = require('express')
const {authentication, authorizeRoles} = require('../../auth/authUtils')
const router = express.Router()

const orderControllerV5 = require('../../controllers/orderControllerV5')
const roles = require("../../utils/roles");
const { asynHandler } = require('../../utils/handler')

router.use(authentication)
router.post('/checkoutPreview',asynHandler(orderControllerV5.checkoutPreview))
router.post('/checkout',asynHandler(orderControllerV5.checkout))
router.get('/listOrderCancelledOfUser',asynHandler(orderControllerV5.listOrderCancelledOfUser))
router.get('/listOrderCompletedOfUser',asynHandler(orderControllerV5.listOrderCompletedOfUser))
router.get('/listOrderPendingOfUser',asynHandler(orderControllerV5.listOrderPendingOfUser))
router.get('/listOrderSuccessOfUser',asynHandler(orderControllerV5.listOrderSuccessOfUser))

router.use(authorizeRoles(roles.ADMIN))
router.patch('/updateStatusCompleted/:order_id',asynHandler(orderControllerV5.updateStatusCompleted))
router.get('/listOrderPending',asynHandler(orderControllerV5.listOrderPending))
router.get('/listOrderCompleted',asynHandler(orderControllerV5.listOrderCompleted))
router.get('/listOrderCancelled',asynHandler(orderControllerV5.listOrderCancelled))
router.get('/listOrderSuccess',asynHandler(orderControllerV5.listOrderSuccess))

module.exports = router
