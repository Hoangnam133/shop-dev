const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const shopModel = require('../models/shopModel')
const favoritesModel = require('../models/favoriteModel')
const shopProductModel = require('../models/shopProductModel')
const {BadRequestError, NotFoundError} = require('../core/errorResponse')
const toggleFavorite = async({user, product_id})=>{
    if(!user){
        throw new BadRequestError('có một chút lỗi xảy ra, vui lòng thử lại')
    }
    if(!product_id){
        throw new BadRequestError('có một chút lỗi xảy ra. Vui lòng thử lại')
    }
    const findProduct = await productModel.findById(product_id)
    if(!findProduct){
        throw new NotFoundError('có một chút lỗi xảy ra. Vui lòng thử lại')
    }
    const userFavorites = await favoritesModel.findOne({
        user_id: user._id,
        product_id: product_id
    })
    if(userFavorites){
        return await deleteProductInFavorites({user, product_id})
       
    }
    else{
        return addFavorite({user, product_id})
    }
}

const addFavorite = async({user, product_id})=>{

    const newFavorite = await favoritesModel.create({
        user_id: user._id,
        product_id: product_id
    })
    if(!newFavorite){
        throw new BadRequestError('Không thể thêm sản phẩm vào danh sách yêu thích')
    }
    return newFavorite
}

const deleteProductInFavorites = async({user, product_id})=>{
    const deleteFavorite = await favoritesModel.findOneAndDelete({
        product_id,
        user_id: user._id
    })
    if(!deleteFavorite){
        throw new NotFoundError('có một chút lỗi xảy ra, vui lòng thử lại')
    }
    return deleteFavorite
}
const getFavorite = async(user)=>{
    if(!user){
        throw new BadRequestError('có một chút lỗi xảy ra, vui lòng thử lại')
    }
    const favorites = await favoritesModel.find({ user_id: user._id }).populate({
        path: 'product_id',
        select: 'product_name product_thumb product_price'
    })
    const fmfavorites = favorites.map(item=> ({
        product_id: {
            _id: item.product_id._id,
            product_name: item.product_id.product_name,
            product_thumb: item.product_id.product_thumb,
            product_price: item.product_id.product_price
        }
    }))
    return {products: fmfavorites}
}
module.exports = {
    toggleFavorite,
    getFavorite,
    deleteProductInFavorites
}