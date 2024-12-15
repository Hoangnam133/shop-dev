const express = require("express");
const {
  authentication,
  handleRefreshToken,
  authorizeRoles,
} = require("../../auth/authUtils");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const userController = require("../../controllers/userController");
const { asynHandler } = require("../../utils/handler");
const upload = require("../../configs/multer");
const roles = require("../../utils/roles");
const userModel = require("../../models/userModel");
const checkRequiredFields = require("../../middlewares/checkRequired");
//list emloyees and manage_branch

router.patch(
  "/updateStatus/:user_id",
  asynHandler(userController.updateStatus)
);

router.get(
  "/listEmployeesOfShop/:shop_id",
  asynHandler(userController.listEmployeesOfShop)
);
router.get("/listEmployees", asynHandler(userController.listEmployees));
router.get(
  "/listManageOfShop/:shop_id",
  asynHandler(userController.listManageOfShop)
);
router.get("/listManage", asynHandler(userController.listManage));

// no authentication
router.post(
  "/handlerRefreshToken",
  handleRefreshToken,
  asynHandler(userController.handlerRefreshToken)
);
router.post(
  "/signUp",
  checkRequiredFields(userModel),
  asynHandler(userController.signUp)
);
router.post("/loginAdmin", asynHandler(userController.loginAdmin));
router.post("/loginUser", asynHandler(userController.loginUser));
router.post(
  "/loginEmployeeAndManager",
  asynHandler(userController.loginEmployeeAndManager)
);

router.post("/forgotPassword", asynHandler(userController.forgotPassword));
router.post("/resetPassword", asynHandler(userController.resetPassword));

router.use(authentication);
router.post("/logout", asynHandler(userController.logout));
router.patch("/changePassword", asynHandler(userController.changePassword));
router.patch(
  "/updatePrUser",
  authorizeRoles(roles.USER),
  upload.single("avatar"),
  asynHandler(userController.updatePr)
);
router.patch(
  "/updatePrEmployeeAndManager",
  authorizeRoles(roles.EMPLOYEE, roles.BRANCH_MANAGER),
  upload.single("avatar"),
  asynHandler(userController.updatePr)
);

router.get("/getUserInfo", asynHandler(userController.getUserInfo));

router.post(
  "/signUpForEmployee",
  authorizeRoles(roles.ADMIN),
  checkRequiredFields(userModel),
  asynHandler(userController.createEmployee)
);
router.post(
  "/signUpForBranchManager",
  authorizeRoles(roles.ADMIN),
  checkRequiredFields(userModel),
  asynHandler(userController.createBranchManager)
);

module.exports = router;
