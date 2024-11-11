const shopService = require("../services/shopService");
const { SuccessResponse } = require("../core/successResponse");
class ShopController {
  createShop = async (req, res, next) => {
    const {file} = req
    if(!file){
      throw new Error('file missing')
    }  
    new SuccessResponse({
      message: "createShop success",
      metaData: await shopService.createShop({
        user: req.user,
        payload: req.body,
        file
      }),
    }).send(res);
  };
  updateShop = async (req, res, next) => {
    const { shop_id } = req.params; 
    const {file} = req
    new SuccessResponse({
      message: "update shop success",
      metaData: await shopService.updateShop({
        shop_id, 
        user: req.user,
        payload: req.body,
        file
      }),
    }).send(res);
  };
  getShopById = async (req, res, next) => {
    const shop_id  = req.params;
    new SuccessResponse({
      message: "get shop success",
      metaData: await shopService.getShopById()
    }).send(res);
  }
  getAllShop = async (req, res, next) => {
    const shop_id  = req.params;
    new SuccessResponse({
      message: "get shop success",
      metaData: await shopService.getAllShop()
    }).send(res);
  }
}
module.exports = new ShopController();
