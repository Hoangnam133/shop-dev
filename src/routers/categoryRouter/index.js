const express = require("express");
const router = express.Router();

const categoryController = require("../../controllers/categoryController");
const { authentication, authorizeRoles } = require("../../auth/authUtils");
const { asynHandler } = require("../../utils/handler");
const {uploadDisk, uploadMemory} = require('../../configs/multer.config')
const roles = require("../../utils/roles");

router.get("/all", asynHandler(categoryController.getAllCategories));
router.get(
  "/getById/:category_id",
  asynHandler(categoryController.getCategoryById)
);

router.use(authentication);


router.get(
  "/list/published",
  asynHandler(categoryController.getAllCategoriesIsPublished)
);

// Lấy tất cả danh mục đã xóa (Chỉ ADMIN)
router.get(
  "/list/deleted",
  authorizeRoles(roles.ADMIN),
  asynHandler(categoryController.getAllCategoriesIsDeleted)
);

// Lấy danh mục mới nhất
router.get("/latest", asynHandler(categoryController.getLatestCategories));

// (Chỉ ADMIN)

// Tạo danh mục mới
router.post(
  "/create",
  authorizeRoles(roles.ADMIN),uploadMemory.single('file'),
  asynHandler(categoryController.createCategory)
);

// Cập nhật danh mục theo ID
router.patch(
  "/update/:category_id",
  authorizeRoles(roles.ADMIN), uploadMemory.single('file'),
  asynHandler(categoryController.updateCategoryById)
);

// Xóa danh mục theo ID
router.delete(
  "/delete/:category_id",
  authorizeRoles(roles.ADMIN),
  asynHandler(categoryController.deleteCategoryById)
);

// Xuất bản danh mục theo ID
router.post(
  "/:category_id/publish",
  asynHandler(categoryController.publishCategoryById)
);

module.exports = router;
