const express = require("express");
const path = require("path");
const { handlePaymentCallback } = require("../../services/orderService_v6"); // Import phương thức xử lý callback
const router = express.Router();
const { BadRequestError } = require("../../core/errorResponse");

router.get("/getSuccess", async (req, res) => {
  const { orderInfo, message, errorCode } = req.query;
  try {
    console.log(errorCode, message, orderInfo);

    // Xử lý callback từ MoMo
    const checkHandelCallBack = await handlePaymentCallback({
      orderId: orderInfo,
      message,
      errorCode,
    });

    if (checkHandelCallBack === true) {
      console.log("Thanh toán thành công");

      // Chuyển hướng về ứng dụng của bạn qua deep link
      res.redirect("hutech_canteen://momoSuccess"); // Gửi deep link ứng dụng nếu thanh toán thành công
    } else {
      console.log("Thanh toán thất bại");

      // Chuyển hướng về ứng dụng của bạn qua deep link nếu thanh toán thất bại
      res.redirect("hutech_canteen://momoFailure"); // Gửi deep link ứng dụng nếu thanh toán thất bại
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Có lỗi xảy ra trong quá trình xử lý thanh toán.");
  }
});

router.get("/returnToApp", (req, res) => {
  res.send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thanh toán thành công</title>
          <script>
              window.onload = function() {
                  // Chuyển hướng người dùng về ứng dụng của bạn qua deep link
                  window.location.href = "hutech_canteen://momoSuccess"; // Deep link của ứng dụng
              }
          </script>
      </head>
      <body>
          <h2>Đang chuyển hướng về ứng dụng của bạn...</h2>
      </body>
      </html>
  `);
});

module.exports = router;
