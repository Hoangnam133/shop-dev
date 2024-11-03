const express = require('express')

const router = express.Router()

const productController = require('../../controllers/productController')
const { asynHandler } = require('../../utils/handler')

// Tạo sản phẩm mới
router.post('/create', asynHandler(productController.createProduct))
// Cập nhật sản phẩm
router.put('/update/:product_id', asynHandler(productController.updateProduct))
// Xóa sản phẩm
router.delete('/delete/:product_id', asynHandler(productController.deleteProduct))
// công khai sản phẩm
router.post('/publish/:product_id', asynHandler(productController.publishProduct))
// Lấy tất cả sản phẩm
// router.get('/', asynHandler(productController.getAllProducts))
// Lấy tất cả sản phẩm theo ID của shop
router.get('/productByshop/:shop_id', asynHandler(productController.getAllProductsByShopId))
// Lấy thông tin sản phẩm theo ID
router.get('/:product_id', asynHandler(productController.getProductById))
// Lấy sản phẩm theo danh mục
router.get('/ProductInCategory/:shop_id', asynHandler(productController.getProductsByCategory))
// Tìm kiếm sản phẩm
router.get('/search', asynHandler(productController.searchProductByUser))
// Lấy sản phẩm đã xuất bản
router.get('/publishedManage/:shop_id', asynHandler(productController.getPublishedProductsManage))

router.get('/published', asynHandler(productController.getPublishedProducts))
// Lấy sản phẩm đã xóa
router.get('/deleted', asynHandler(productController.getDeletedProducts))
// lấy sản phẩm đã xóa của chi nhánh
router.get('/deletedShop/:shop_id', asynHandler(productController.getDeletedProductsManage))
// Lấy sản phẩm theo đánh giá giảm dần
router.get('/sortedRating/:shop_id', asynHandler(productController.getProductsSortedByRatingDesc))
// Lấy sản phẩm theo giá
router.get('/sortedPrice/:shop_id', asynHandler(productController.getProductsSortedByPrice))
// Lấy sản phẩm mới nhất
router.get('/latest/:shop_id', asynHandler(productController.getLatestProducts))
// Lấy sản phẩm theo số lượng bán
router.get('/sales_count/shop/:shop_id', asynHandler(productController.getProductsSortedBysales_count))

module.exports = router
