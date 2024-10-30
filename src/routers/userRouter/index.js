const express = require('express')
const {authentication, handleRefreshToken} = require('../../auth/authUtils')
const rateLimit = require('express-rate-limit')
const router = express.Router()
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 5, 
    message: 'Quá nhiều yêu cầu, hãy thử lại sau.'
})
const userController = require('../../controllers/userController')
const { asynHandler } = require('../../utils/handler')
const upload = require("../../utils/multer");
router.post('/handlerRefreshToken',handleRefreshToken,asynHandler(userController.handlerRefreshToken))
router.post('/signUp', asynHandler(userController.signUp))
router.post('/login',asynHandler(userController.login))
router.post('/forgotPassword', asynHandler(userController.forgotPassword))
router.post('/resetPassword', asynHandler(userController.resetPassword))
router.use(authentication)
router.post('/logout', asynHandler(userController.logout))
router.patch('/changePassword', asynHandler(userController.changePassword))
router.patch(
    "/updatePr",
    upload.single("avatar"),
    asynHandler(userController.updatePr)
  );
  router.get("/getUserInfo", asynHandler(userController.getUserInfo));
module.exports = router
