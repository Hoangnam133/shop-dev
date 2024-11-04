const openingHoursService = require('../services/openningHoursService')
const {SuccessResponse} = require('../core/successResponse')

class OpeningHoursController {
    getOpeningHours = async (req, res, next) => {
        new SuccessResponse({
            message: 'get opening hours success',
            metaData: await openingHoursService.createOpeningHours(req.body)
        }).send(res)
    }
    getAllOpeningHours = async (req, res, next) => {
        new SuccessResponse({
            message: 'get all opening hours success',
            metaData: await openingHoursService.getAllOpeningHours()
        }).send(res)
    }
    updateOpeningHours = async (req, res, next) => {
        new SuccessResponse({
            message: 'update opening hours success',
            metaData: await openingHoursService.updateOpenningHours({
                openingHours_id: req.params.openingHours_id,
                payload: req.body
            })
        }).send(res)
    }
    getOpeningHoursById = async (req, res, next) => {
        new SuccessResponse({
            message: 'get opening hours success',
            metaData: await openingHoursService.getOpeningHoursById(req.params.openingHours_id)
        }).send(res)
    }
    softDeleteOpenningHours = async(req, res, next)=>{
        new SuccessResponse({
            message: 'soft delete opening hours success',
            metaData: await openingHoursService.softDeleteOpenningHours(req.params.openingHours_id)
        }).send(res)
    }
    getDeletedOpeningHours = async(req, res, next)=>{
        new SuccessResponse({
            message: 'get deleted opening hours success',
            metaData: await openingHoursService.getDeletedOpeningHours()
        }).send(res)
    }
    getAllOpeningHoursOfShopId = async(req, res, next)=>{
        new SuccessResponse({
            message: 'get deleted opening hours success',
            metaData: await openingHoursService.getAllOpeningHoursOfShopId(req.shop._id)
        }).send(res)
    }
    restoreOpeningHours = async(req, res, next)=>{
        new SuccessResponse({
            message: 'get deleted opening hours success',
            metaData: await openingHoursService.restoreOpeningHours(req.params.openingHours_id)
        }).send(res)
    }
}
module.exports = new OpeningHoursController()