const shopService = require('../services/shopService')
const {SuccessResponse} = require('../core/successResponse')
class ShopController{
    createShop = async(req, res, next)=>{
        new SuccessResponse({
            message: 'createShop success',
            metaData: await shopService.createShop({
                user: req.user,
                ...req.body
            })
        }).send(res)
    }
    updateShop = async(req, res, next)=>{
        new SuccessResponse({
            message: 'update shop success',
            metaData: await shopService.updateShop({
                user: req.user,
                bodyUpdate: req.body
            })
        }).send(res)
    }
}
module.exports = new ShopController()