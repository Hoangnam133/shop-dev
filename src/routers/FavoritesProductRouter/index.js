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


