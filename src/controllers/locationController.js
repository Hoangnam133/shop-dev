const locationService = require('../services/locationService')
const {SuccessResponse} = require('../core/successResponse')
class LocationController {
    createLocation = async (req, res, next) => {
        new SuccessResponse({
            message: 'create location success',
            metaData: await locationService.createLocation({
                payload: req.body,
                user: req.user
            })
        }).send(res)
    }
    getAllLocation = async (req, res, next) => {
        new SuccessResponse({
            message: 'get all location success',
            metaData: await locationService.getAllLocations()
        }).send(res)
    }
    updateLocation = async (req, res, next) => {
        new SuccessResponse({
            message: 'update location success',
            metaData: await locationService.updateLocationById({
                payload: req.body,
                location_id: req.params.location_id,
                user: req.user
            })
        }).send(res)
    }
    deleteLocation = async (req, res, next) => {
        new SuccessResponse({
            message: 'delete location success',
            metaData: await locationService.deleteLocationById({
                location_id: req.params.location_id,
                user: req.user
            })
        }).send(res)
    }
    getLocationById = async (req, res, next) => {
        new SuccessResponse({
            message: 'get location success',
            metaData: await locationService.getLocationById({
                location_id: req.params.location_id
            })
        }).send(res)
    }
}
module.exports = new LocationController()