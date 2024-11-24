const express = require("express");

const router = express.Router();

const RedeemPointsController = require("../../controllers/RedeemPointsController");
const { asynHandler } = require("../../utils/handler");
const { authentication } = require("../../auth/authUtils")
router.use(authentication)
router.post(
  "/create/:product_id",
  asynHandler(RedeemPointsController.createRedeemPoints)
)
router.get(
    "/getRedeemPointsUsed",
    asynHandler(RedeemPointsController.getRedeemPointsUsed)
)
router.get(
    "/getRedeemPointsNotUsed",
    asynHandler(RedeemPointsController.getRedeemPointsNotUsed)
)
module.exports = router;
