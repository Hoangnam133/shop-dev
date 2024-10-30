const express = require('express')

const router = express.Router()

const productController = require('../../controllers/productController')
const { asynHandler } = require('../../utils/handler')



router.get('/category/:Category_id', asynHandler(productController.findProductsByLargeCategory))
router.get('/subcategory/:subCategory_id', asynHandler(productController.findProductsBySubCategory))
router.get('/search', asynHandler(productController.searchProductByUser))
router.get('/all', asynHandler(productController.findAllProduct))

const {authentication, authorizeRoles} = require('../../auth/authUtils')

router.use(authentication)
router.get('/find/:product_id', asynHandler(productController.findProductById))
router.post('/create', authorizeRoles('ADMIN'), asynHandler(productController.createProduct))
router.patch('/update/:productId', authorizeRoles('ADMIN'), asynHandler(productController.updateProduct))
router.delete('/delete/:productId', authorizeRoles('ADMIN'), asynHandler(productController.deleteProduct))
router.patch('/publish/:product_id', authorizeRoles('ADMIN'), asynHandler(productController.publishProduct))

router.get('/deleted', authorizeRoles('ADMIN'),asynHandler(productController.findDeletedProducts))
router.get('/draft', authorizeRoles('ADMIN'),asynHandler(productController.findDraftProducts))


module.exports = router
