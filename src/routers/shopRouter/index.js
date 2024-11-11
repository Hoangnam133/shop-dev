const express = require("express");
const { authentication, authorizeRoles } = require("../../auth/authUtils");
const roles = require("../../utils/roles");
const router = express.Router();
const {uploadDisk, uploadMemory} = require('../../configs/multer.config')
const shopController = require("../../controllers/shopController");
const { asynHandler } = require("../../utils/handler");
router.get(
  "/getAll",
  asynHandler(shopController.getAllShop)
);
router.get(
  "/getById/:shop_id",
  asynHandler(shopController.getShopById)
);
router.use(authentication);
router.post(
  "/create",
  authorizeRoles(roles.ADMIN), uploadMemory.single('file'),
  asynHandler(shopController.createShop)
);
router.patch(
  "/update/:shop_id", uploadMemory.single('file'),
  authorizeRoles(roles.ADMIN, roles.BRANCH_MANAGER),
  asynHandler(shopController.updateShop)
);
module.exports = router;
