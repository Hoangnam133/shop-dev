const redeemPointsService = require('../services/RedeemPointService')
const { SuccessResponse } = require('../core/successResponse')

class RedeemPointsController {
    createRedeemPoints = async (req, res, next) => {
        new SuccessResponse({
            message: 'create redeem points success',
            metaData: await redeemPointsService.createRedeemPoints({
                user: req.user,
                product_id: req.params.product_id
            })
        }).send(res)
    }
     // Lấy danh sách mã đã đổi
     getRedeemPointsUsed = async (req, res, next) => {
       
            const { limit, page } = req.query;
            const result = await redeemPointsService.getRedeemPointsUsed({
                user: req.user,
                limit: parseInt(limit) || 10,
                page: parseInt(page) || 1
            })
            new SuccessResponse({
                message: 'Get redeemed points used successfully',
                metaData: result
            }).send(res)
    }
    getRedeemPointsNotUsed = async (req, res, next) => {
       
            const { limit, page } = req.query
            const result = await redeemPointsService.getRedeemPointsNotUsed({
                user: req.user,
                limit: parseInt(limit) || 10,
                page: parseInt(page) || 1
            });
            new SuccessResponse({
                message: 'Get redeem points not used successfully',
                metaData: result
            }).send(res)
    }
}

module.exports = new RedeemPointsController()