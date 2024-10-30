const orderService = require('../services/orderService_v4')
const {SuccessResponse} = require('../core/successResponse')
class OrderController {
    checkoutReview = async(req, res, next)=>{
        new SuccessResponse({
            message: 'checkout review success',
            metaData: await orderService.checkOutReview({
                user: req.user,
                ...req.body
            })
        }).send(res)
    }
    checkOutByUser = async(req, res, next)=>{
        new SuccessResponse({
            message: 'checkout review success',
            metaData: await orderService.checkOutByUser({
                user: req.user,
                ...req.body
            })
        }).send(res)
    }
    handlePaymentCallback = async (req, res, next) => {
        try {
            await orderService.handlePaymentCallback({
                user: req.user,
                ...req.body
            })
            res.status(200).send({ message: 'Payment callback processed successfully' })
        } catch (error) {
            next(error)
        }
    }
     // Danh sách đơn hàng đã hủy của người dùng
    listOrderCancelledOfUser = async (req, res, next) => {
        new SuccessResponse({
            message: 'list of cancelled orders',
            metaData: await orderService.listOrderCancelledOfUser(req.user)
        }).send(res)
    }

    // Danh sách đơn hàng đã hoàn thành của người dùng
    listOrderCompletedOfUser = async (req, res, next) => {
        new SuccessResponse({
            message: 'list of completed orders',
            metaData: await orderService.listOrderCompletedOfUser(req.user)
        }).send(res)
    }

    // Danh sách đơn hàng đang chờ xử lý của người dùng
    listOrderPendingOfUser = async (req, res, next) => {
        new SuccessResponse({
            message: 'list of pending orders',
            metaData: await orderService.list_OrderPendingOfUser(req.user)
        }).send(res)
    }

    // Danh sách đơn hàng thành công của người dùng
    listOrderSuccessOfUser = async (req, res, next) => {
        new SuccessResponse({
            message: 'list of successful orders',
            metaData: await orderService.listOrderSuccessOfUser(req.user)
        }).send(res)
    }

    // Cập nhật trạng thái đơn hàng thành hoàn thành
    updateStatusCompleted = async (req, res, next) => {
        new SuccessResponse({
            message: 'update order status to completed',
            metaData: await orderService.updateStatusCompleted(req.params.order_id)
        }).send(res)
    }

    // Cập nhật trạng thái đơn hàng thành đã hủy
    updateStatusCancelled = async (req, res, next) => {
        new SuccessResponse({
            message: 'update order status to cancelled',
            metaData: await orderService.updateStatusCancelled(req.params.order_id)
        }).send(res)
    }

    // Lấy danh sách đơn hàng đang chờ xử lý (cho admin)
    listOrderPending = async (req, res, next) => {
        new SuccessResponse({
            message: 'list of pending orders',
            metaData: await orderService.listOrderPending(req.query)
        }).send(res)
    }

    // Lấy danh sách đơn hàng đã hoàn thành (cho admin)
    listOrderCompleted = async (req, res, next) => {
        new SuccessResponse({
            message: 'list of completed orders',
            metaData: await orderService.listOrderCompleted(req.query)
        }).send(res)
    }

    // Lấy danh sách đơn hàng đã hủy (cho admin)
    listOrderCancelled = async (req, res, next) => {
        new SuccessResponse({
            message: 'list of cancelled orders',
            metaData: await orderService.listOrderCancelled(req.query)
        }).send(res)
    }

    // Lấy danh sách đơn hàng thành công (cho admin)
    listOrderSuccess = async (req, res, next) => {
        new SuccessResponse({
            message: 'list of successful orders',
            metaData: await orderService.listOrderSuccess(req.query)
        }).send(res)
    }
}
module.exports = new OrderController()