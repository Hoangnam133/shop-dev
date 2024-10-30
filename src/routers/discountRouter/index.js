const express = require('express')
const {authentication, authorizeRoles} = require('../../auth/authUtils')
const router = express.Router()

const discountController = require('../../controllers/discountController')

const { asynHandler } = require('../../utils/handler')
router.get('/getAllDiscounts', asynHandler(discountController.getAllDiscounts))
router.use(authentication)
router.post('/create', authorizeRoles('ADMIN'),asynHandler(discountController.createDiscount))
router.patch('/update/:discount_id', authorizeRoles('ADMIN'),asynHandler(discountController.updateDiscount))
router.get('/getDiscountsByCode/:code', asynHandler(discountController.getDiscountByCode))
module.exports = router
