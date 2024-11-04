const sideDishService = require('../services/sideDishService')
const {SuccessResponse} = require('../core/successResponse')
class SideDishController {
    createSideDish = async (req, res, next) => {
        new SuccessResponse({
            message: 'create side dish success',
            metaData: await sideDishService.createSideDish(req.body)
        }).send(res)
    }
    getAllSideDishes = async (req, res, next) => {
        const {limit, page} = req.query
        new SuccessResponse({
            message: 'get all side dishes success',
            metaData: await sideDishService.getAllSideDishes({limit, page})
        }).send(res)
    }
    getAllDeletedSideDishes = async (req, res, next) => {
        const {limit, page} = req.query
        new SuccessResponse({
            message: 'get all side dishes success',
            metaData: await sideDishService.getAllDeletedSideDishes({limit, page})
        }).send(res)
    }
    restoreDeletedSideDish = async (req, res, next) => {
        new SuccessResponse({
            message: 'get side dish by id success',
            metaData: await sideDishService.restoreDeletedSideDish(req.params.sideDish_id)
        }).send(res)
    }
    updateSideDish = async (req, res, next) => {
        new SuccessResponse({
            message: 'update side dish success',
            metaData: await sideDishService.updateSideDish({
                sideDish_id: req.params.sideDish_id,
                payload: req.body
            })
        }).send(res)
    }
    deleteSideDish = async (req, res, next) => {
        new SuccessResponse({
            message: 'delete side dish success',
            metaData: await sideDishService.deleteSideDish(req.params.sideDish_id)
        }).send(res)
    }
    getSideDishById = async (req, res, next) => {
        new SuccessResponse({
            message: 'get side dish by id success',
            metaData: await sideDishService.getSideDishById(req.params.sideDish_id)
        }).send(res)
    }
    getProductsBySideDish = async (req, res, next) => {
        const {limit, page} = req.query
        const sideDish_id = req.params.sideDish_id
        new SuccessResponse({
            message: 'get products by side dish success',
            metaData: await sideDishService.getProductsBySideDish({sideDish_id, limit, page})
        }).send(res)
    }
}
module.exports = new SideDishController()