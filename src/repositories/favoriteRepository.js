const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const shopModel = require('../models/shopModel')
const favoritesModel = require('../models/favoriteModel')

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