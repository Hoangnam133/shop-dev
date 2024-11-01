const express = require("express");
const {
  authentication,
  handleRefreshToken,
  authorizeRoles,
} = require("../../auth/authUtils");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Quá nhiều yêu cầu, hãy thử lại sau.",
});
const userController = require("../../controllers/userController");
const { asynHandler } = require("../../utils/handler");
const upload = require("../../utils/multer");
const roles = require("../../utils/roles");
router.post(
  "/handlerRefreshToken",
  handleRefreshToken,
  asynHandler(userController.handlerRefreshToken)
);
router.post("/signUp", asynHandler(userController.signUp));
// router.post("/login", asynHandler(userController.login));
router.post("/loginAdmin", asynHandler(userController.loginAdmin));
router.post("/loginUser", asynHandler(userController.loginUser));
router.post("/loginEmployee", asynHandler(userController.loginEmployee));
router.post(
  "/loginBranchManager",
  asynHandler(userController.loginBranchManager)
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
  "/updatePrEmployee",
  authorizeRoles(roles.EMPLOYEE),
  upload.single("avatar"),
  asynHandler(userController.updatePr)
);

//BRANCH
router.patch(
  "/updatePrManager",
  authorizeRoles(roles.BRANCH_MANAGER),
  upload.single("avatar"),
  asynHandler(userController.updatePr)
);
router.get("/getUserInfo", asynHandler(userController.getUserInfo));

router.post(
  "/createEmployee",
  authorizeRoles(roles.ADMIN),
  asynHandler(userController.createEmployee)
);
router.post(
  "/createBranchManager",
  authorizeRoles(roles.ADMIN),
  asynHandler(userController.createBranchManager)
);
module.exports = router;
