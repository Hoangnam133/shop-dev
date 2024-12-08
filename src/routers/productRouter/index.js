const express = require("express");

const router = express.Router();

const productController = require("../../controllers/productController");
const recommendationController = require("../../controllers/recommendationController_V2");

const ElasticsearchController = require("../../controllers/ElasticsearchController");
const { authentication, authorizeRoles } = require("../../auth/authUtils")
const { asynHandler } = require("../../utils/handler");
const roles = require("../../utils/roles");
const {uploadDisk, uploadMemory} = require('../../configs/multer.config')
router.get("/searchELT", asynHandler(ElasticsearchController.searchProduct));




router.get("/getAllProducts", asynHandler(productController.getAllProducts));
router.use(authentication);
router.get(
  "/getRecommendationsForUser",
  asynHandler(recommendationController.getRecommendations)
)
// Tạo sản phẩm mới
// fix update
router.post(
  "/create",
  authorizeRoles(roles.ADMIN), uploadMemory.single('file'),
  asynHandler(productController.createProduct)
);
// Cập nhật sản phẩm
router.patch(
  "/update/:product_id",
  authorizeRoles(roles.ADMIN), uploadMemory.single('file'),
  asynHandler(productController.updateProduct)
);
// Xóa sản phẩm
router.delete(
  "/delete/:product_id",
  authorizeRoles(roles.ADMIN),
  asynHandler(productController.deleteProduct)
);
// công khai sản phẩm
router.post(
  "/publish/:product_id",
  asynHandler(productController.publishProduct)
);
// Lấy tất cả sản phẩm
// router.get('/', asynHandler(productController.getAllProducts))
// Lấy tất cả sản phẩm theo ID của shop
router.get(
  "/productByshop/:shop_id",
  asynHandler(productController.getAllProductsByShopId)
);
// Lấy thông tin sản phẩm theo ID
router.get(
  "/getProductById/:product_id",
  asynHandler(productController.getProductByIdDetails)
);
// Lấy sản phẩm theo danh mục
router.get(
  "/ProductInCategory/:category_id",
  asynHandler(productController.getProductsByCategory)
);
// Tìm kiếm sản phẩm
router.get("/search", asynHandler(productController.searchProductByUser));
// Lấy sản phẩm đã xuất bản
router.get(
  "/publishedManage",
  authorizeRoles(roles.BRANCH_MANAGER),
  asynHandler(productController.getPublishedProductsManage)
);

router.get(
  "/published",
  authorizeRoles(roles.ADMIN),
  asynHandler(productController.getPublishedProducts)
);
// Lấy sản phẩm đã xóa
router.get(
  "/deleted",
  authorizeRoles(roles.ADMIN),
  asynHandler(productController.getDeletedProducts)
);
// lấy sản phẩm đã xóa của chi nhánh
router.get(
  "/deletedShop",
  authorizeRoles(roles.BRANCH_MANAGER),
  asynHandler(productController.getDeletedProductsManage)
);
// Lấy sản phẩm theo đánh giá sắp xếp tuỳ chọn (?sortOrder=1 => Tăng dần || ?sortOrder=1 => Giảm dần)
// mặc định là tăng dần
router.get(
  "/sortedRating",
  asynHandler(productController.getProductsSortedByRating)
);
// Lấy sản phẩm theo giá sắp xếp tuỳ chọn (?sortOrder=1 => Tăng dần || ?sortOrder=1 => Giảm dần)
// mặc định là tăng dần
router.get(
  "/sortedPrice",
  asynHandler(productController.getProductsSortedByPrice)
);

// Lấy sản phẩm mới nhất
router.get("/latest", asynHandler(productController.getLatestProducts));
// Lấy sản phẩm theo số lượng bán
router.get(
  "/sales_count/shop/:shop_id",
  authorizeRoles(roles.BRANCH_MANAGER, roles.EMPLOYEE, roles.ADMIN),
  asynHandler(productController.getProductsSortedBysales_count)
);

module.exports = router;
