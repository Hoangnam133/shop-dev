const userService = require('../services/userService')
const {SuccessResponse} = require('../core/successResponse')
class UserController{
    signUp = async(req, res, next)=>{
        new SuccessResponse({
            message: 'signUp success',
            metaData: await userService.signUp(req.body)
        }).send(res)
    }
    login = async(req, res, next)=>{
        new SuccessResponse({
            message: 'signUp success',
            metaData: await userService.login(req.body)
        }).send(res)
    }
    logout = async(req, res, next) =>{
        await userService.logout(req.keyStore)
        res.status(200).json({
            message: 'logout success'
        })
    }
    handlerRefreshToken = async(req, res, next)=>{
        new SuccessResponse({
            message: 'refreshToken success',
            metaData: await userService.handlerRefreshToken({
                refreshToken: req.refreshToken,
                userId: req.userId,
                keyStore: req.keyStore
            })
        }).send(res)
    }
    forgotPassword = async(req, res, next)=>{
        new SuccessResponse({
            message: 'forgotPassword success',
            metaData: await userService.forgotPassword(req.body)
        }).send(res)
    }
    resetPassword = async(req, res, next)=>{
        new SuccessResponse({
            message: 'forgotPassword success',
            metaData: await userService.resetPassword(req.body)
        }).send(res)
    }
    changePassword = async(req, res, next)=>{
        new SuccessResponse({
            message: "change pass success",
            metaData: await userService.changePassword({
                user: req.user,
                ...req.body
            })
        }).send(res)
    }
    updatePr = async (req, res, next) => {
        try {
          const user = req.user;
          const updateData = req.body;
    
          if (req.file) {
            updateData.avatar = `uploads/${req.file.filename}`;
          }
    
          const updatedUser = await userService.updatePr({
            user,
            updateData,
          });
    
          new SuccessResponse({
            message: "Update profile success",
            metaData: updatedUser,
          }).send(res);
        } catch (error) {
          next(error);
        }
      };
      getUserInfo = async (req, res, next) => {
        new SuccessResponse({
          message: "Get user info success",
          metaData: await userService.getUserInfo({ userId: req.user._id }),
        }).send(res);
      };
    
}
module.exports = new UserController()