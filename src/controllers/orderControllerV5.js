const OrderServiceV5 = require("../services/orderService_v7");
const { SuccessResponse } = require("../core/successResponse");
class OrderControllerV5 {
  getCategorySales = async (req, res, next) => {
    new SuccessResponse({
      message: "list best selling products success",
      metaData: await OrderServiceV5.getCategorySales(req.query.timeRange),
    }).send(res);
  };
  getBestSellingProducts = async (req, res, next) => {
    new SuccessResponse({
      message: "list best selling products success",
      metaData: await OrderServiceV5.getBestSellingProducts(
        req.query.timeRange
      ),
    }).send(res);
  };
  getStatistics = async (req, res, next) => {
    new SuccessResponse({
      message: "list best selling products success",
      metaData: await OrderServiceV5.getStatistics(req.query.timeRange),
    }).send(res);
  };
  getTotalRevenueInShop = async (req, res, next) => {
    new SuccessResponse({
      message: "list best selling products success",
      metaData: await OrderServiceV5.getTotalRevenueInShop(req.params.shop_id),
    }).send(res);
  };
  listBestSellingProductsInShop = async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    new SuccessResponse({
      message: "list best selling products success",
      metaData: await OrderServiceV5.listBestSellingProductsInShop(
        req.params.shop_id,
        limit
      ),
    }).send(res);
  };
  getOrderDetail = async (req, res, next) => {
    this.user = req.user;
    this.orderId = req.params.order_id;
    new SuccessResponse({
      message: "order detail success",
      metaData: await OrderServiceV5.getOrderDetail(this.user, this.orderId),
    }).send(res);
  };
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

  updateStatusSuccess = async (req, res, next) => {
    new SuccessResponse({
      message: "update order status to Success",
      metaData: await OrderServiceV5.updateStatusSuccess(req.params.order_id),
    }).send(res);
  };
  // Cập nhật trạng thái đơn hàng thành hoàn thành
  updateStatusCompleted = async (req, res, next) => {
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
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    new SuccessResponse({
      message: "list of pending orders",
      metaData: await OrderServiceV5.listOrderPending({
        limit,
        page,
        shop: req.shop,
      }),
    }).send(res);
  };

  // Lấy danh sách đơn hàng đã hoàn thành (cho admin)
  listOrderCompleted = async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    new SuccessResponse({
      message: "list of completed orders",
      metaData: await OrderServiceV5.listOrderCompleted({
        limit,
        page,
        shop: req.shop,
      }),
    }).send(res);
  };

  // Lấy danh sách đơn hàng đã hủy (cho admin)
  listOrderCancelled = async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    new SuccessResponse({
      message: "list of cancelled orders",
      metaData: await OrderServiceV5.listOrderCancelled({
        limit,
        page,
        shop: req.shop,
      }),
    }).send(res);
  };

  // Lấy danh sách đơn hàng thành công (cho admin)
  listOrderSuccess = async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    new SuccessResponse({
      message: "list of successful orders",
      metaData: await OrderServiceV5.listOrderSuccess({
        limit,
        page,
        shop: req.shop,
      }),
    }).send(res);
  };
}
module.exports = new OrderControllerV5();
