const shopModel = require('../models/shopModel')
const {findByEmail, findById} = require('../repositories/userRepository')
const {BadRequestError} = require('../core/errorResponse')
const { getInfoData } = require('../utils')
const {removeUndefinedObject} = require('../utils/index')
class ShopService{
    static createShop = async({user, shop_name, shop_location, shop_image})=>{
        if(!user){
            throw new BadRequestError('not found user')
        }
        const newShop = await shopModel.create({
            shop_name,
            shop_location,
            shop_image,
            shop_owner: user._id
        })
        return {
            shop: getInfoData({fileds:['shop_name','shop_location','shop_image'],object: newShop})
        }
    }
    static updateShop = async({user, bodyUpdate})=>{
        if(!user){
            throw new BadRequestError('not found user')
        }
        const foundShop = await shopModel.findOne({shop_owner: user._id})
        if(!foundShop){
            throw new BadRequestError('not found shop')
        }
        const cleanedUpdate = removeUndefinedObject(bodyUpdate)
        const updatedShop = await shopModel.findByIdAndUpdate(foundShop._id, cleanedUpdate,{
            new: true,
            runValidators: true
        })
        if(!updatedShop){
            throw new BadRequestError('update shop fail')
        }
        return {
            shop: getInfoData({fileds:['shop_name','shop_location','shop_image'],object: updatedShop})
        }
    }
}
module.exports = ShopService