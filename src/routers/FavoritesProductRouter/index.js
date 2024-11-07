const express = require("express");
const { authentication, authorizeRoles } = require("../../auth/authUtils");
const router = express.Router();
const roles = require("../../utils/roles");
const FavoriteController = require("../../controllers/FavoriteController");

const { asynHandler } = require("../../utils/handler");

router.use(authentication);

router.get("/getFavorites", asynHandler(FavoriteController.getFavorites));
router.post(
  "/addFavorite/:product_id",
  asynHandler(FavoriteController.toggleFavorite)
);
router.post(
  "/deleteFavorite/:product_id",
  asynHandler(FavoriteController.deleteFavorite)
);

module.exports = router;
// mỗi khi xóa sản phẩm ở ADMIN thì xóa luôn sản phẩm trong giỏ hàng và trong danh sách yêu thích
