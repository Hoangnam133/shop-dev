const {processMoMoRefund} = require('../momo/moMoRefund_v2')
const orderModel = require('../models/orderModel')
const {BadRequestError} = require('../core/errorResponse')
class MoMoRefundService {
    static async Refund(orderId, transId){
        const existingOrder = await orderModel.findOne({
            _id: orderId,
            "order_payment.payment_status": "Success",
            order_status: "cancelled",
            transId: transId,
            isRefunded: false
        })
        if(!existingOrder){
            throw new BadRequestError('Invalid order or refund request')
        }
        const processR = await processMoMoRefund(orderId, transId,existingOrder.order_checkout.totalAmount)
        if(!processR){
            throw new BadRequestError('Failed to refund MoMo payment')
        }
        existingOrder.isRefunded = true
        await existingOrder.save()
        return {
            message: 'Refund successfully'
        }
    }
}
module.exports = MoMoRefundService