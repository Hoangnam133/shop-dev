const express = require('express')
const {authentication, authorizeRoles} = require('../../auth/authUtils')
const router = express.Router()

const shopController = require('../../controllers/shopController')
const { asynHandler } = require('../../utils/handler')

router.use(authentication)
router.post('/create', authorizeRoles('ADMIN'),asynHandler(shopController.createShop))
router.patch('/update',authorizeRoles('ADMIN'),asynHandler(shopController.updateShop))
module.exports = router
