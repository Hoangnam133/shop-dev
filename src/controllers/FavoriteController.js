const favoriteService = require('../services/favoriteProductsService')
const {SuccessResponse} = require('../core/successResponse')
class FavoriteController{
    toggleFavorite = async (req, res, next) => {
        new SuccessResponse({
            message: 'Toggle favorite success',
            metaData: await favoriteService.toggleFavorite({
                user: req.user,
                product_id: req.params.product_id
            })
        }).send(res)
    }
    getFavorites = async (req, res, next) => {
        new SuccessResponse({
            message: 'Get favorites success',
            metaData: await favoriteService.getFavoriteProducts(
                req.user
            )
        }).send(res)
    }
    deleteFavorite = async (req, res, next) => {
        new SuccessResponse({
            message: 'Delete favorite success',
            metaData: await favoriteService.deleteProductInFavorites({
                user: req.user,
                product_id: req.params.product_id
            })
        }).send(res)
    }
}
module.exports = new FavoriteController()