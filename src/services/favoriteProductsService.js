const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const {toObjectId} = require('../utils/index')
class FavoritesProductService{
    static async toggleFavoriteProduct({user, product_id}){
        if(!user){
            throw new BadRequestError('User  not found')
        }
        if(!product_id ){
            throw new BadRequestError('product_id not found')
        }
        const findProduct = await productModel.findById(toObjectId(product_id.trim().toString()))
        if(!findProduct){
            throw new NotFoundError('Product not found')
        }
        const userFavorites = await userModel.find({
            _id: user._id,
            favorites: findProduct._id
        })
        if(userFavorites.length > 0){
            const Remove_ProductFromFavoritesList = await userModel.updateOne(
                {_id: user._id},
                {$pull: {favorites: findProduct._id}}
            )
            if(Remove_ProductFromFavoritesList){
                console.log('remove product from favorites success')
            }
            else{
                console.log('remove product from favorites fail')
            }
        }
        else{
            const Add_ProductToFavoritesList = await userModel.updateOne(
                {_id: user._id},
                {$push: {favorites: findProduct._id}}
            )
            if(Add_ProductToFavoritesList){
                console.log('add product to favorites success')
            }
            else{
                console.log('add product to favorites fail')
            }
        }
    }
    static async getFavoriteProducts(user) {
        if (!user) {
            throw new BadRequestError('User not found')
        }
        const userFavorites = await userModel.findById(user._id)
        if (userFavorites && userFavorites.favorites.length > 0) {
            const favoriteProductIds = userFavorites.favorites
            const favoriteProducts = await productModel.find({ _id: { $in: favoriteProductIds } }).lean()
            return favoriteProducts
        } else {
            return []
        }
    }
    
    static async removeProductInFavorite({user,product_id}){
        if(!user){
            throw new BadRequestError('User  not found')
        }
        if(!product_id ){
            throw new BadRequestError('product_id not found')
        }
        const userFavorites = await userModel.findOneAndUpdate(
            {favorites: toObjectId(product_id.trim().toString()),
                _id: user._id
            },
            {$pull: {favorites: toObjectId(product_id.trim().toString())}},
            {new: true}
        ).lean()
        if(userFavorites){
            console.log('remove product from favorites success')
        }
        else{
            console.log('remove product from favorites fail')
        }
    }
}
module.exports = FavoritesProductService