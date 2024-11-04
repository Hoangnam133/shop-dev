const express = require("express");
const { authentication, authorizeRoles } = require("../../auth/authUtils");
const roles = require("../../utils/roles");
const sideDishController = require("../../controllers/sideDishController");
const { asynHandler } = require("../../utils/handler");

const router = express.Router()

// router.use(authentication)
router.post(
  "/create",
  asynHandler(sideDishController.createSideDish)
)
router.get(
  "/getAll",
  asynHandler(sideDishController.getAllSideDishes)
)
router.get(
  "/getAlldeleted",
  asynHandler(sideDishController.getAllDeletedSideDishes)
)
router.patch(
  "/restore/:sideDish_id",
  asynHandler(sideDishController.restoreDeletedSideDish)
)
router.patch(
  "/update/:sideDish_id",
  asynHandler(sideDishController.updateSideDish)
)
router.patch(
  "/delete/:sideDish_id",
  asynHandler(sideDishController.deleteSideDish)
)
router.get(
  "/:sideDish_id",
  asynHandler(sideDishController.getSideDishById)
)
router.get(
  "sideDishInProducts/:sideDish_id/",
  asynHandler(sideDishController.getProductsBySideDish)
)
module.exports = router
