const OrderServiceV5 = require("../services/orderService_v7");
const { SuccessResponse } = require("../core/successResponse");
class OrderControllerV5 {
  checkoutPreview = async (req, res, next) => {
    new SuccessResponse({
      message: "checkout review success",
      metaData: await OrderServiceV5.checkoutPreview({
        user: req.user,
        shop: req.shop,
        ...req.body,
      }),
    }).send(res);
  };
  checkout = async (req, res, next) => {
    new SuccessResponse({
      message: "checkout review success",
      metaData: await OrderServiceV5.checkout({
        user: req.user,
        shop: req.shop,
        ...req.body,
      }),
    }).send(res);
  };
  cancelOrder = async (req, res, next) => {
    new SuccessResponse({
      message: "cancal order success",
      metaData: await OrderServiceV5.cancelOrder({
        order_id: req.params.order_id,
        user: req.user,
      }),
    }).send(res);
  };
  // Danh sách đơn hàng đã hủy của người dùng
  listOrderCancelledOfUser = async (req, res, next) => {
    new SuccessResponse({
      message: "list of cancelled orders",
      metaData: await OrderServiceV5.listOrderCancelledOfUser(req.user),
    }).send(res);
  };

  // Danh sách đơn hàng đã hoàn thành của người dùng
  listOrderCompletedOfUser = async (req, res, next) => {
    new SuccessResponse({
      message: "list of completed orders",
      metaData: await OrderServiceV5.listOrderCompletedOfUser(req.user),
    }).send(res);
  };

  // Danh sách đơn hàng đang chờ xử lý của người dùng
  listOrderPendingOfUser = async (req, res, next) => {
    new SuccessResponse({
      message: "list of pending orders",
      metaData: await OrderServiceV5.list_OrderPendingOfUser(req.user),
    }).send(res);
  };

  // Danh sách đơn hàng thành công của người dùng
  listOrderSuccessOfUser = async (req, res, next) => {
    new SuccessResponse({
      message: "list of successful orders",
      metaData: await OrderServiceV5.listOrderSuccessOfUser(req.user),
    }).send(res);
  };

  // Cập nhật trạng thái đơn hàng thành hoàn thành
  updateStatusCompleted = async (req, res, next) => {
    console.log(req.params.order_id);

    new SuccessResponse({
      message: "update order status to completed",
      metaData: await OrderServiceV5.updateStatusCompleted(req.params.order_id),
    }).send(res);
  };

  // Cập nhật trạng thái đơn hàng thành đã hủy
  updateStatusCancelled = async (req, res, next) => {
    new SuccessResponse({
      message: "update order status to cancelled",
      metaData: await OrderServiceV5.updateStatusCancelled(req.params.order_id),
    }).send(res);
  };

  // Lấy danh sách đơn hàng đang chờ xử lý (cho admin)
  listOrderPending = async (req, res, next) => {
    new SuccessResponse({
      message: "list of pending orders",
      metaData: await OrderServiceV5.listOrderPending(req.query),
    }).send(res);
  };

  // Lấy danh sách đơn hàng đã hoàn thành (cho admin)
  listOrderCompleted = async (req, res, next) => {
    new SuccessResponse({
      message: "list of completed orders",
      metaData: await OrderServiceV5.listOrderCompleted(req.query),
    }).send(res);
  };

  // Lấy danh sách đơn hàng đã hủy (cho admin)
  listOrderCancelled = async (req, res, next) => {
    new SuccessResponse({
      message: "list of cancelled orders",
      metaData: await OrderServiceV5.listOrderCancelled(req.query),
    }).send(res);
  };

  // Lấy danh sách đơn hàng thành công (cho admin)
  listOrderSuccess = async (req, res, next) => {
    new SuccessResponse({
      message: "list of successful orders",
      metaData: await OrderServiceV5.listOrderSuccess(req.query),
    }).send(res);
  };
}
module.exports = new OrderControllerV5();
