const {getFavorite, toggleFavorite, deleteProductInFavorites} = require('../repositories/favoriteRepository')
class FavoritesProductService{
    static async toggleFavorite({user, product_id}){
        return await toggleFavorite({user, product_id})
    }
    static async getFavoriteProducts(user){
        return await getFavorite(user)
    }
    static async deleteProductInFavorites({user, product_id}){
        return await deleteProductInFavorites({user, product_id})
    }
}
module.exports = FavoritesProductService