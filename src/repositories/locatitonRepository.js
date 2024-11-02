const locationModel = require('../models/locationModel')
const {BadRequestError, NotFoundError} = require('../core/errorResponse')
const {removeUndefinedObject} = require('../utils/index')
const userModel = require('../models/userModel')
const dotenv = require('dotenv')

dotenv.config()
const createLocation = async ({payload, user})=>{
    if(!user){
        throw new BadRequestError('User not found')
    }
    const checkRoles = await userModel.findOne({
        _id: user._id,
        roles: process.env.ROLES_ADMIN
    })
    if(!checkRoles){
        throw new BadRequestError('User does not have sufficient permissions to perform this action')
    }
    const newLocation = await locationModel.create(payload)
    if(!newLocation){
        throw new BadRequestError('Failed to create location')
    }
    return newLocation
}

const getAllLocations = async()=>{
    const locations = await locationModel.find({
        isDeleted: false
    }).lean()
    if(!locations){
        throw new NotFoundError('No locations found')
    }
    return locations
}

const getLocationById = async (location_id) => {
    const location = await locationModel.findById(location_id).lean()
    if (!location) throw new NotFoundError('Location not found')
    return location
}

const updateLocationById = async ({location_id, payload, user})=>{
    if(!user){
        throw new BadRequestError('User not found')
    }
    const checkRoles = await userModel.findOne({
        _id: user._id,
        roles: process.env.ROLES_ADMIN
    })
    const cleanData = removeUndefinedObject(payload)
    const updatedLocation = await locationModel.findByIdAndUpdate(location_id, cleanData, {new: true}).lean()
    if(!updatedLocation){
        throw new NotFoundError('Location not found')
    }
    return updatedLocation
}

const deleteLocationById = async ({location_id, user}) => {
    if(!user){
        throw new BadRequestError('User not found')
    }
    const checkRoles = await userModel.findOne({
        _id: user._id,
        roles: process.env.ROLES_ADMIN
    })
    const updateLocation = await locationModel.findByIdAndUpdate(location_id, {isDeleted: true}).lean()
    if(!updateLocation){
        throw new NotFoundError('Location not found')
    }
    return updateLocation
}

module.exports = {
    createLocation,
    getAllLocations,
    getLocationById,
    updateLocationById,
    deleteLocationById,
}