const openingHoursModel = require('../models/openingHoursModel')
const {NotFoundError, BadRequestError} = require('../core/errorResponse')
const {isDuplicateNameOnCreate, toObjectId, removeUndefinedObject, isDuplicateUpdateField} = require('../utils/index')
const shopModel = require('../models/shopModel')
// tạo giờ mở và đóng cửa
const createOpeningHours = async(payload)=>{
    const {name} = payload
    const checkName = await isDuplicateNameOnCreate({model: openHoursModel, fieldName: "name", name})
    if(checkName){
        throw new BadRequestError("Opening hours name already exists")
    }
    const newOpeningHours = await openingHoursModel.create(payload)
    if(!newOpeningHours){
        throw new BadRequestError("Failed to create opening hours")
    }
    return newOpeningHours
}
// lấy tất cả giờ mở và đóng của 1 shop cụ thể
const getAllOpeningHoursOfShopId = async(shop_id)=>{
    const foundShop = await shopModel.findById(toObjectId(shop_id))
    if(!foundShop){
        throw new NotFoundError("Shop not found")
    }
    const getOpenningHours = await openingHoursModel.find({
        _id: foundShop.opening_hours,
        isDeleted: false
    })
    if(!getOpenningHours){
        throw new NotFoundError("No opening hours found")
    }
    return getOpenningHours
}
// lấy ra tất cả giờ mở và đóng cửa
const getAllOpeningHours = async({limit = 10, page = 1})=>{
    const skip = (page - 1) * limit
    const openingHours = await openingHoursModel.find({
        isDeleted: false
    })
        .skip(skip)
        .limit(limit)
        .select('name')
    return openingHours
}
// chi tiết giờ mở và đóng
const getOpeningHoursById = async(openingHours_id)=>{
    const foundOpeningHours = await openingHoursModel.findById(toObjectId(openingHours_id))
    if(!foundOpeningHours){
        throw new NotFoundError("Opening hours not found")
    }
    return foundOpeningHours
}
// cập nhật
const updateOpenningHours = async({openingHours_id, payload})=>{
    const foundOpeningHours = await openingHoursModel.findById(toObjectId(openingHours_id))
    if(!foundOpeningHours){
        throw new NotFoundError("Opening hours not found")
    }
    const cleanData = removeUndefinedObject(payload)
    if(cleanData.name){
        const checkName = await isDuplicateUpdateField({model: openingHoursModel, fieldName: "name", excludeId: foundOpeningHours._id, value: cleanData.name})
        if(checkName){
            throw new BadRequestError("Opening hours name already exists")
        }
    }
    if(cleanData.isDeleted === true){
        await softDeleteOpenningHours(foundOpeningHours._id)
    }
    const updateOpeningHours = await openingHoursModel.findByIdAndUpdate(openingHours_id, cleanData, {new: true, lean: true})
    if(!updateOpeningHours){
        throw new BadRequestError("Failed to update opening hours")
    }
    return updateOpeningHours
}
// xóa mềm
const softDeleteOpenningHours = async(openingHours_id)=>{
    const foundOpeningHours = await openingHoursModel.findByIdAndUpdate(toObjectId(openingHours_id), {isDeleted: true}, {new: true, lean: true})
    if(!foundOpeningHours){
        throw new NotFoundError("Opening hours not found")
    }
    return foundOpeningHours
}
// lấy ra những giờ mở cửa đã bị xóa
const getDeletedOpeningHours = async()=>{
    const deletedOpeningHours = await openingHoursModel.find({isDeleted: true})
    if(!deletedOpeningHours){
        throw new NotFoundError("No deleted opening hours found")
    }
    return deletedOpeningHours
}
const restoreOpeningHours = async(openingHours_id)=>{
    const foundOpeningHours = await openingHoursModel.findByIdAndUpdate(toObjectId(openingHours_id), {isDeleted: false}, {new: true, lean: true})
    if(!foundOpeningHours){
        throw new NotFoundError("Opening hours not found")
    }
    return foundOpeningHours
}
module.exports = {
    createOpeningHours,
    getAllOpeningHours,
    getOpeningHoursById,
    updateOpenningHours,
    softDeleteOpenningHours,
    getDeletedOpeningHours,
    getAllOpeningHoursOfShopId,
    restoreOpeningHours
}