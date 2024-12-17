const express = require("express");
const path = require("path");
const router = express.Router();
const orderModel = require("../../models/orderModel");
const { runProducer } = require("../../message_queue/rabbitmq/producer");
const { asynHandler } = require("../../utils/handler");
const { authentication, authorizeRoles } = require("../../auth/authUtils");
const axios = require("axios");
const moMoRefundController = require("../../controllers/moMoRefundController");
const { emitEvent } = require("../../../socketio");

router.post(
  "/refunds",
  authentication,
  asynHandler(moMoRefundController.refund)
);
let paymentResults = {};

router.get("/getSuccess", async (req, res) => {
  const { orderInfo, message, extraData, amount, transId } = req.query;
  const errorCode = parseInt(req.query.errorCode, 10);

  try {
    console.log("Thông tin nhận được:", req.query);

    if (errorCode === 0 && message === "Success") {
      let payload = {
        orderInfo,
        shop_id: extraData || "Unknown Shop ID",
        transId,
      };
      console.log("Payload gửi tới RabbitMQ:", payload);
      await runProducer(payload);

      // Tìm thông tin đơn hàng từ cơ sở dữ liệu (có thể sử dụng `orderModel`)
      const orderDetails = await orderModel
        .findById(orderInfo)
        .populate("order_product");

      if (!orderDetails) {
        throw new Error("Không tìm thấy đơn hàng.");
      }

      // Lấy thông tin đơn hàng chi tiết
      const customerName = orderDetails.order_userId.name;
      const products = orderDetails.order_product
        .map((product) => product.name)
        .join(", ");
      const totalAmount = orderDetails.order_checkout.finalPrice;

      // Trả về phản hồi thành công trước
      res.status(200).send({
        status: 200,
        message: "Thanh toán thành công. Cảm ơn bạn đã mua hàng!",
      });

      // Gửi sự kiện payment_success cho tất cả các client sau khi gửi phản hồi thành công
      io.emit("payment_success", {
        orderId: orderInfo,
        customerName,
        products,
        amount: totalAmount,
      });
    } else {
      const cancelledOrder = await orderModel.deleteOne({
        _id: orderInfo,
      });
      if (cancelledOrder) {
        console.log("Đơn hàng đã hủy:", cancelledOrder);
      }

      res.status(500).send({
        status: 500,
        message:
          "Có lỗi xảy ra trong quá trình xử lý thanh toán. Vui lòng thử lại sau.",
      });
    }
  } catch (error) {
    console.error("Lỗi xảy ra:", error);
    res.status(500).send("Có lỗi xảy ra trong quá trình xử lý thanh toán.");
  }
});

router.get("/result", (req, res) => {
  res.status(200).send({
    status: 200,
    message: "Kết quả thanh toán:",
    results: paymentResults,
  });
});

module.exports = router;
