const discountService = require('../services/discountService')
const {SuccessResponse} = require('../core/successResponse')
class DiscountController {
    createDiscount = async(req, res, next)=>{
        new SuccessResponse({
            message: 'create discount success',
            metaData: await discountService.createDiscount(req.body)
        }).send(res)
    }
    getAllDiscounts = async(req, res, next)=>{
        new SuccessResponse({
            message: 'get all discounts success',
            metaData: await discountService.getAllDiscounts(req.query)
        }).send(res)
    }
    updateDiscount = async(req, res, next)=>{
        new SuccessResponse({
            message: 'update discount success',
            metaData: await discountService.updateDiscount({
                discount_id: req.params.discount_id,
                dataUpdate: req.body
            })
        }).send(res)
    }
    getDiscountByCode = async(req, res, next)=>{
        new SuccessResponse({
            message: 'get discount by code success',
            metaData: await discountService.getDiscountByCode(req.params.code)
        }).send(res)
    }
}
module.exports = new DiscountController()