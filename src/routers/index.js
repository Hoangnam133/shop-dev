const express = require('express')
const router = express.Router()
router.use('/v2/api/user', require('./userRouter/index'))
router.use('/v2/api/shop', require('./shopRouter/index'))
router.use('/v2/api/category', require('./categoryRouter/index'))
router.use('/v2/api/product', require('./productRouter/index'))
router.use('/v2/api/cart', require('./cartRouter/index'))
router.use('/v2/api/discount', require('./discountRouter/index'))
router.use('/v2/api/order', require('./orderRouter/index'))
router.use('/v2/api/comment', require('./commentRouter/index'))
router.use('/v2/api/review', require('./reviewRouter/index'))
router.use('/v2/api/favorite', require('./FavoritesProductRouter/index'))
module.exports = router