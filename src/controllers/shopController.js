const shopService = require("../services/shopService");
const { SuccessResponse } = require("../core/successResponse");
class ShopController {
  createShop = async (req, res, next) => {
    const { file } = req;
    if (!file) {
      throw new Error("file missing");
    }
    new SuccessResponse({
      message: "createShop success",
      metaData: await shopService.createShop({
        user: req.user,
        payload: req.body,
        file,
      }),
    }).send(res);
  };
  updateShop = async (req, res, next) => {
    const { shop_id } = req.params;
    const { file } = req;
    new SuccessResponse({
      message: "update shop success",
      metaData: await shopService.updateShop({
        shop_id,
        user: req.user,
        payload: req.body,
        file,
      }),
    }).send(res);
  };
  getShopById = async (req, res, next) => {
    new SuccessResponse({
      message: "get shop success",
      metaData: await shopService.getShopById(req.params.shop_id),
    }).send(res);
  };
  getAllShop = async (req, res, next) => {
    // const shop_id  = req.params;
    new SuccessResponse({
      message: "get shop success",
      metaData: await shopService.getAllShop(),
    }).send(res);
  };
  getAllShopsWithLocation = async (req, res) => {
    try {
        // Gọi service để lấy danh sách cửa hàng cùng với thông tin địa lý
        const shops = await shopService.getAllShopsWithLocation();

        // Trả về dữ liệu cửa hàng cho client
        res.status(200).json({
            status: "success",
            data: shops,
        });
    } catch (err) {
        // Nếu có lỗi xảy ra, trả về lỗi 500
        console.error("Lỗi khi lấy danh sách cửa hàng:", err.message);
        res.status(500).json({
            status: "error",
            message: err.message || "Không thể lấy danh sách cửa hàng",
        });
    }
};

}
module.exports = new ShopController();
