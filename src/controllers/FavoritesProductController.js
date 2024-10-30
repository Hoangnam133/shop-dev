const FavoritesProductService = require('../services/favoriteProductsService')
const {SuccessResponse} = require('../core/successResponse')
class FavoritesProductController {
    toggleFavorite = async(req, res, next) => {
        new SuccessResponse({
            message: 'Toggle favorite success',
            metaData: await FavoritesProductService.toggleFavoriteProduct({
                user: req.user,
                product_id: req.params.product_id
            })
        }).send(res)
    }
    getFavorites = async (req, res, next) => {
       try {
        new SuccessResponse({
            message: 'Get favorites success',
            metaData: await FavoritesProductService.getFavoriteProducts(req.user)
        }).send(res)
       }catch (err) {
        console.error(err)
        next(err)
       }
    }
    deleteFavorite = async(req, res, next) => {
        new SuccessResponse({
            message: 'Delete favorite success',
            metaData: await FavoritesProductService.removeProductInFavorite({
                user: req.user,
                product_id: req.params.product_id
            })
        }).send(res)
    }
}
module.exports = new FavoritesProductController()