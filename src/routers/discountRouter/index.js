const express = require("express");
const { authentication, authorizeRoles } = require("../../auth/authUtils");
const router = express.Router();

const discountController = require("../../controllers/discountController");
const { asynHandler } = require("../../utils/handler");
const roles = require("../../utils/roles");
const {uploadDisk, uploadMemory} = require('../../configs/multer.config')

router.get(
  "/getValidDiscounts",
  asynHandler(discountController.getValidDiscounts)
);
router.use(authentication);
// Lấy danh sách tất cả các mã giảm giá
router.get(
  "/getAllDiscounts",
  asynHandler(discountController.getActiveDiscounts)
);
// router.use(authentication);

// Tạo mã giảm giá mới (chỉ ADMIN có quyền)
router.post(
  "/create",
  authorizeRoles(roles.ADMIN), uploadMemory.single('file'),
  asynHandler(discountController.createDiscount)
);
// Cập nhật mã giảm giá theo discount_id (chỉ ADMIN có quyền)
router.patch(
  "/update/:discount_id",
  authorizeRoles(roles.ADMIN),
  asynHandler(discountController.updateDiscountById)
);
// Lấy mã giảm giá theo mã code
router.get(
  "/getDiscountsByCode/:discountCode",
  asynHandler(discountController.getDiscountByCode)
);
// Lấy thông tin mã giảm giá theo discount_id
router.get(
  "/getDiscountById/:discount_id",
  asynHandler(discountController.getDiscountById)
);
// Xóa mềm mã giảm giá theo discount_id (chỉ ADMIN có quyền)
router.patch(
  "/softDelete/:discount_id",
  authorizeRoles(roles.ADMIN),
  asynHandler(discountController.softDeleteDiscount)
);
// Kiểm tra mã giảm giá đã hết hạn chưa (kiểm tra theo discountCode)
router.get(
  "/isDiscountExpired/:discountCode",
  asynHandler(discountController.isDiscountExpired)
);
// Lấy danh sách các mã giảm giá công khai
router.get(
  "/getPublicDiscounts",
  asynHandler(discountController.getPublicDiscounts)
);

module.exports = router;
