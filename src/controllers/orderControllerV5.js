const OrderServiceV5 = require('../services/orderService_v5')
const {SuccessResponse} = require('../core/successResponse')

class OrderControllerV5 {
    checkoutPreview = async (req, res, next) => {
        new SuccessResponse({
            message: 'checkout review success',
            metaData: await OrderServiceV5.checkoutPreview({
                user: req.user,
                shop: req.shop,
                ...req.body
            })
        }).send(res)
    }
    checkout = async (req, res, next) => {
        new SuccessResponse({
            message: 'checkout review success',
            metaData: await OrderServiceV5.checkout({
                user: req.user,
                shop: req.shop,
                ...req.body
            })
        }).send(res)
    }
}
module.exports = new OrderControllerV5()