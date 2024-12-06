const MoMoRefundService = require('../services/MoMoRefundService')
const {SuccessResponse} = require('../core/successResponse')
class MoMoRefundController {
    refund = async(req, res, next) => {
        const {orderId, transId} = req.body
        new SuccessResponse({
            message: 'Refund success',
            metaData: await MoMoRefundService.Refund(orderId, transId)
        }).send(res)
    }
}

module.exports = new MoMoRefundController()