const shopService = require("../services/shopService");
const { SuccessResponse } = require("../core/successResponse");
class ShopController {
  createShop = async (req, res, next) => {
    new SuccessResponse({
      message: "createShop success",
      metaData: await shopService.createShop({
        user: req.user,
        ...req.body,
      }),
    }).send(res);
  };
  updateShop = async (req, res, next) => {
    const { shop_id } = req.params; // Get shop_id from request parameters
    new SuccessResponse({
      message: "update shop success",
      metaData: await shopService.updateShop({
        shop_id, // Pass shop_id here
        user: req.user,
        bodyUpdate: req.body,
      }),
    }).send(res);
  };
}
module.exports = new ShopController();
