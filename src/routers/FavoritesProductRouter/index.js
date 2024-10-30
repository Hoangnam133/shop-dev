const express = require('express')
const {authentication} = require('../../auth/authUtils')
const router = express.Router()

const FavoritesProductController = require('../../controllers/FavoritesProductController')

const { asynHandler } = require('../../utils/handler')

router.use(authentication)

router.get('/getFavorites',asynHandler(FavoritesProductController.getFavorites))
router.patch('/deleteProductInFavorites/:product_id',asynHandler(FavoritesProductController.deleteFavorite))
router.patch('/toggleFavorite/:product_id',asynHandler(FavoritesProductController.toggleFavorite))
module.exports = router
// mỗi khi xóa sản phẩm ở ADMIN thì xóa luôn sản phẩm trong giỏ hàng và trong danh sách yêu thích