const express = require('express')
const {authentication, authorizeRoles} = require('../../auth/authUtils')
const router = express.Router()

const orderControllerV5 = require('../../controllers/orderControllerV5')

const { asynHandler } = require('../../utils/handler')

router.use(authentication)
router.post('/checkoutPreview',asynHandler(orderControllerV5.checkoutPreview))
router.post('/checkout',asynHandler(orderControllerV5.checkout))
module.exports = router
