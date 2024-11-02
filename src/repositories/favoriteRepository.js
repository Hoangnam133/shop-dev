const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const shopModel = require('../models/shopModel')
const favoritesModel = require('../models/favoriteModel')
const shopProductModel = require('../models/shopProductModel')
const toggleFavorite = async({user, product_id})=>{
    if(!user){
        throw new BadRequestError('User not found')
    }
    if(!product_id){
        throw new BadRequestError('Product_id not found')
    }
    const findProduct = await productModel.findById(product_id)
    if(!findProduct){
        throw new NotFoundError('Product not found')
    }
    const userFavorites = await favoritesModel.findOne({
        user_id: user._id,
        product_id: product_id
    })
    if(userFavorites){
        await deleteProductInFavorites({user, product_id})
    }
    else{
        await addFavorite({user, product_id})
    }
}

const addFavorite = async({user, product_id})=>{

    const newFavorite = await favoritesModel.create({
        user_id: user._id,
        product_id: product_id
    })
    if(!newFavorite){
        throw new InternalServerError('Failed to add product to favorites')
    }
    return newFavorite
}

const deleteProductInFavorites = async({user, product_id})=>{
    const deleteFavorite = await favoritesModel.findOneAndDelete({
        product_id,
        user_id: user._id
    })
    if(!deleteFavorite){
        throw new NotFoundError('Product not found in favorites')
    }
    return deleteFavorite
}

const getFavorite = async({user, shop})=>{
    if(!user){
        throw new BadRequestError('User not found')
    }
    const favorites = await favoritesModel.find({ user_id: user._id }).populate('product_id');
    if (!favorites || favorites.length === 0) {
          throw new NotFoundError('Favorites not found')
    }
    const favoriteProductIds = favorites.map(favorite => favorite.product_id._id);
    const shopProducts = await shopProductModel.find({ shop_id: shop._id, product_id: { $in: favoriteProductIds } }).populate('product_id');
    if (!shopProducts || shopProducts.length === 0) {
          throw new NotFoundError('No favorite products found for this shop');
    }
    return shopProducts.map(shopProduct => shopProduct.product_id)
}
module.exports = {
    toggleFavorite,
    getFavorite,
    deleteProductInFavorites
}