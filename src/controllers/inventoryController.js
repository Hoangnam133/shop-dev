const inventoryService = require("../services/inventoryService");
const { SuccessResponse } = require("../core/successResponse");

class InventoryController {
  // Hàm kiểm tra số lượng sản phẩm còn lại ở các chi nhánh
  getProductStockInAllShops = async (req, res, next) => {
    const { product_id } = req.params;
    const { limit, page } = req.query;
    console.log(product_id);

    new SuccessResponse({
      message: "Product stock fetched successfully",
      metaData: await inventoryService.getProductStockInAllShops({
        product_id,
        limit,
        page,
      }),
    }).send(res);
  };

  // Lấy sản phẩm sắp hết hàng ở một cửa hàng cụ thể
  getLowStockProductsInShop = async (req, res, next) => {
    const { shop_id } = req.params;
    const { limit, page } = req.query;
    new SuccessResponse({
      message: "Low stock products fetched successfully",
      metaData: await inventoryService.getLowStockProductsInShop({
        shop_id,
        limit,
        page,
      }),
    }).send(res);
  };

  // Lấy số lượng sản phẩm ở một cửa hàng cụ thể
  getProductStockInShop = async (req, res, next) => {
    const { shop_id, product_id } = req.params;
    const { limit, page } = req.query;
    new SuccessResponse({
      message: "Product stock in shop fetched successfully",
      metaData: await inventoryService.getProductStockInShop({
        shop_id,
        product_id,
        limit,
        page,
      }),
    }).send(res);
  };

  // Thêm sản phẩm vào kho
  // Thêm sản phẩm vào kho
  addProductToInventory = async (req, res, next) => {
    const { product_id, shop_id, inven_stock, minStockLevel } = req.body; // Thêm minStockLevel vào đây
    try {
      const result = await inventoryService.addProductToInventory({
        product_id,
        shop_id,
        inven_stock,
        minStockLevel, // Truyền minStockLevel vào đây
      });
      new SuccessResponse({
        message: "Product added to inventory successfully",
        metaData: result,
      }).send(res);
    } catch (error) {
      next(error);
    }
  };

  // Giảm số lượng hàng tồn kho
  reduceInventoryStock = async (req, res, next) => {
    const { product_id, shop_id, quantity } = req.body;
    new SuccessResponse({
      message: "Inventory stock reduced successfully",
      metaData: await inventoryService.reduceInventoryStock({
        product_id,
        shop_id,
        quantity,
      }),
    }).send(res);
  };

  // Kiểm tra số lượng hàng tồn kho
  checkInventoryStock = async (req, res, next) => {
    const { product_id, shop_id, quantity } = req.body;
    new SuccessResponse({
      message: "Inventory stock checked successfully",
      metaData: await inventoryService.checkInventoryStock({
        product_id,
        shop_id,
        quantity,
      }),
    }).send(res);
  };

  // Cập nhật kho hàng
  updateInventory = async (req, res, next) => {
    const { product_id, quantity, minStockLevel } = req.body;
    const { shop_id } = req.params;
    new SuccessResponse({
      message: "Inventory updated successfully",
      metaData: await inventoryService.updateInventory({
        shop_id,
        product_id,
        quantity,
        minStockLevel,
      }),
    }).send(res);
  };

  // Kiểm tra sản phẩm đã hết hàng ở tất cả các cửa hàng
  checkProductOutOfStockAllShops = async (req, res, next) => {
    const { product_id } = req.params;
    const limit = req.query.limit || 10;
    const page = req.query.page || 1;

    new SuccessResponse({
      message: "Checked out of stock for all shops successfully",
      metaData: await inventoryService.checkProductOutOfStockAllShops({
        product_id,
        limit,
        page,
      }),
    }).send(res);
  };

  // Lấy sản phẩm sắp hết hàng ở tất cả các cửa hàng
  getLowStockProductsAcrossAllShops = async (req, res, next) => {
    // Lấy limit và page từ query string và chuyển đổi thành số
    const limit = parseInt(req.query.limit) || 10; // Mặc định là 10 nếu không có
    const page = parseInt(req.query.page) || 1; // Mặc định là 1 nếu không có
    new SuccessResponse({
      message: "Low stock products across all shops fetched successfully",
      metaData: await inventoryService.getLowStockProductsAcrossAllShops(
        limit,
        page
      ),
    }).send(res);
  };

  // Khôi phục sản phẩm trong kho
  restoreProductInInventory = async (req, res, next) => {
    const { product_id, shop_id } = req.body;
    new SuccessResponse({
      message: "Product restored in inventory successfully",
      metaData: await inventoryService.restoreProductInInventory({
        product_id,
        shop_id,
      }),
    }).send(res);
  };

  // Lấy các sản phẩm đã bị xóa trong kho
  getDeletedProductsInInventory = async (req, res, next) => {
    const { shop_id } = req.params;
    const { limit, page } = req.query;
    new SuccessResponse({
      message: "Deleted products fetched successfully",
      metaData: await inventoryService.getDeletedProductsInInventory({
        shop_id,
        limit,
        page,
      }),
    }).send(res);
  };

  // Xóa sản phẩm trong kho
  softDeleteProductInInventory = async (req, res, next) => {
    const { shop_id, product_id } = req.body;
    new SuccessResponse({
      message: "Product soft deleted successfully",
      metaData: await inventoryService.softDeleteProductInInventory({
        shop_id,
        product_id,
      }),
    }).send(res);
  };
}

module.exports = new InventoryController();
