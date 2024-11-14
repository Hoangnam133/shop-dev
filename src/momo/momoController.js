const { processMoMoPayment } = require("./paymentService");
const { SuccessResponse } = require("../core/successResponse");
class MoMoController {
  paymentTest = async (req, res, next) => {
    new SuccessResponse({
      message: "payment success",
      metaData: await processMoMoPayment({
        orderId: "123456",
        totalPrice: 10000,
      }),
    }).send(res);
  };
}
module.exports = new MoMoController();
