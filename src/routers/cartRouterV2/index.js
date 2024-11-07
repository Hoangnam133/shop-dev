const express = require('express')
const {authentication, authorizeRoles} = require('../../auth/authUtils')
const router = express.Router()

const cartv2Controller = require('../../controllers/cartv2Controller')
const { asynHandler } = require('../../utils/handler')

router.use(authentication)
router.post('/addToCart', asynHandler(cartv2Controller.addToCart))
router.post('/deleteProductInCart', asynHandler(cartv2Controller.deleteProductInCart))
router.patch('/incProductQuantity', asynHandler(cartv2Controller.incProductQuantity))
router.patch('/decProductQuantity', asynHandler(cartv2Controller.DecProductQuantity))
router.get('/getCartByUserId', asynHandler(cartv2Controller.getCartByUserId))

module.exports = router
