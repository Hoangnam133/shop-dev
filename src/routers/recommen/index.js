const express = require("express");

const router = express.Router();

const recommendationController = require("../../controllers/recommendationController");
const { asynHandler } = require("../../utils/handler");
const { authentication, authorizeRoles } = require("../../auth/authUtils")
router.use(authentication)
router.get(
  "/getRecommendationsForUser",
  asynHandler(recommendationController.getRecommendations)
)

module.exports = router;
