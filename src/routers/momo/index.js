const express = require("express");
const path = require("path");
const router = express.Router();
const { BadRequestError } = require("../../core/errorResponse");
const { SuccessResponse } = require("../../core/successResponse");

const {runProducer} = require('../../message_queue/rabbitmq/producer')

router.get("/getSuccess", async (req, res) => {
  const { orderInfo, message, errorCode } = req.query;
  try {
    console.log(errorCode, message, orderInfo);
    if(errorCode === 0 && message === 'Success') {
        let payload = {
            orderInfo,
            shop_id: req.shop_id
        }
        const processAfterPayment = await runProducer(payload)
        if(processAfterPayment) {
            console.log('producer received data successfully')
        }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Có lỗi xảy ra trong quá trình xử lý thanh toán.");
  }
});

module.exports = router;