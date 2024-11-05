const express = require("express");
const router = express.Router();
const inventoryController = require("../../controllers/inventoryController");
const { asynHandler } = require("../../utils/handler");
const { authentication, authorizeRoles } = require("../../auth/authUtils");
const roles = require("../../utils/roles");
router.use(authentication);

//lấy số lượng sản phẩm ở tất cả các shop
router.get(
  "/productStockInAllShops/:product_id",
  authorizeRoles(roles.ADMIN, roles.EMPLOYEE, roles.BRANCH_MANAGER),
  asynHandler(inventoryController.getProductStockInAllShops)
);
//lấy sản phẩm sắp hết hàng ở một shop cụ thể
router.get(
  "/lowStockProductsInShop/:shop_id",
  authorizeRoles(roles.ADMIN, roles.EMPLOYEE, roles.BRANCH_MANAGER),
  asynHandler(inventoryController.getLowStockProductsInShop)
);
//lấy số lượng sản phẩm ở một shop cụ thể
router.get(
  "/productStockInShop/:shop_id/:product_id",
  authorizeRoles(roles.ADMIN, roles.EMPLOYEE, roles.BRANCH_MANAGER),
  asynHandler(inventoryController.getProductStockInShop)
);
// kiểm tra số lượng hàng tồn kho của 1 sp
router.post(
  "/checkInventoryStock",
  authorizeRoles(roles.ADMIN, roles.EMPLOYEE, roles.BRANCH_MANAGER),
  asynHandler(inventoryController.checkInventoryStock)
);
// thêm sản phẩm vào kho
router.post(
  "/add",
  authorizeRoles(roles.ADMIN, roles.BRANCH_MANAGER),
  asynHandler(inventoryController.addProductToInventory)
);
// không test/////////////////////////////////////////////////////////////////////////
router.patch("/reduce", asynHandler(inventoryController.reduceInventoryStock));
// cập nhật kho hàng ở 1 shop cụ thể
router.patch(
  "/update/:shop_id",
  authorizeRoles(roles.ADMIN, roles.BRANCH_MANAGER),
  asynHandler(inventoryController.updateInventory)
);
// kiểm tra sản phẩm đã hết hàng ở tất cả các shop
router.get(
  "/checkOutOfStockAllShops/:product_id",
  authorizeRoles(roles.ADMIN, roles.BRANCH_MANAGER, roles.EMPLOYEE),
  asynHandler(inventoryController.checkProductOutOfStockAllShops)
);
// sản phẩm sắp hết hàng ở tất cả shop
router.get(
  "/lowStockProductsAcrossAllShops",
  authorizeRoles(roles.ADMIN, roles.BRANCH_MANAGER),
  asynHandler(inventoryController.getLowStockProductsAcrossAllShops)
);
//  khôi phục sản phẩm trong kho
router.patch(
  "/restore",
  authorizeRoles(roles.ADMIN, roles.BRANCH_MANAGER),
  asynHandler(inventoryController.restoreProductInInventory)
);
// danh sách sản phẩm bị xóa trong 1 shop
router.get(
  "/deletedProductsInInventory/:shop_id",
  authorizeRoles(roles.ADMIN, roles.BRANCH_MANAGER),
  asynHandler(inventoryController.getDeletedProductsInInventory)
);
// xóa 1 sản phẩm trong 1 shop
router.patch(
  "/softDelete",
  asynHandler(inventoryController.softDeleteProductInInventory)
);

module.exports = router;
