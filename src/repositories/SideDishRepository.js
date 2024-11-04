const sideDishModel = require('../models/sideDishModel')
const { NotFoundError, BadRequestError } = require('../core/errorResponse')
const productModel = require('../models/productModel')
const {isDuplicateNameOnCreate, toObjectId, isDuplicateUpdateField, removeUndefinedObject} = require('../utils/index')
// tạo món phụ
const createSideDishModel = async(payload)=>{
    const checkName = await isDuplicateNameOnCreate({
        model: sideDishModel,
        fieldName:'sideDish_name',
        name: payload.sideDish_name
    })
    if(checkName){
        throw new BadRequestError('Side dish name already exists')
    }
    const sideDish = await sideDishModel.create(payload)
    if(!sideDish){
        throw new BadRequestError('Failed to create side dish')
    }
    return sideDish
}
// tìm món phụ theo id
const findSideDishById = async (sideDish_id) => {
    const sideDish = await sideDishModel.findById(toObjectId(toObjectId(sideDish_id)));
    if (!sideDish || sideDish.isDeleted) {
        throw new NotFoundError('Side dish not found');
    }
    return sideDish;
}
// cập nhật món phụ
const updateSideDishById = async ({sideDish_id, payload}) => {
    const sideDish = await findSideDishById(toObjectId(sideDish_id));
    if (!sideDish) {
        throw new NotFoundError('Side dish not found');
    }
    const cleanData = removeUndefinedObject(payload)
    if(cleanData.sideDish_name){
        const existingName = await isDuplicateUpdateField({
            model: sideDishModel,
            fieldName: "sideDish_name",
            excludeId: sideDish._id,
            value: cleanData.sideDish_name,
        });
        if (existingName) {
            throw new BadRequestError('Side dish name already exists');
        }
    }
    const updatedSideDish = await sideDishModel.findByIdAndUpdate(
        toObjectId(payload),
        updateData,
        { new: true, lean: true } 
    )
    if (!updatedSideDish) {
        throw new NotFoundError('update Side dish fail');
    }
    return updatedSideDish;
}
// xóa món phụ
const softDeleteSideDishById = async (sideDish_id) => {
    const deletedSideDish = await sideDishModel.findByIdAndUpdate(
        toObjectId(sideDish_id),
        { isDeleted: true },
        { new: true }
    )
    if (!deletedSideDish) {
        throw new NotFoundError('Side dish not found');
    }
    const deleteSideInProduct = await productModel.updateMany(
        { sideDish_id: deletedSideDish._id },
        { $pull: { sideDish_id: deletedSideDish._id } } 
    );
    if(!deleteSideInProduct){
        throw new NotFoundError('Failed to delete side dish in products');
    }
    return deletedSideDish;

}
// danh sách món phụ
const listSideDishes = async ({limit, page}) => {
    const skip = (page - 1) * limit
    const sideDishes = await sideDishModel.find({ isDeleted: false })
    .skip(skip)
    .limit(limit)
    if (!sideDishes) {
        throw new NotFoundError('No side dishes found');
    }
    return sideDishes;
}
// danh sách món phụ đã xóa
const listDeletedSideDishes = async ({limit, page}) => {
    const skip = (page - 1) * limit
    const deletedSideDishes = await sideDishModel.find({ isDeleted: true })
    .skip(skip)
    .limit(limit)
    if (!deletedSideDishes) {
        throw new NotFoundError('No deleted side dishes found');
    }
    return deletedSideDishes;
}
// khôi phục lại món phụ đã xóa
const restoreDeletedSideDishById = async (sideDish_id) => {
    const restoredSideDish = await sideDishModel.findByIdAndUpdate(
        toObjectId(sideDish_id),
        { isDeleted: false },
        { new: true , lean: true}
    )
    if (!restoredSideDish) {
        throw new NotFoundError('Side dish not found');
    }
    return restoredSideDish
}
// tìm sản phẩm đang xài món phụ này
const findProductsBySideDishId = async({sideDish_id, limit, page})=>{
    const skip = (page - 1) * limit
    const foundSideDish = await sideDishModel.findById(toObjectId(sideDish_id))
    if(!sideDish){
        throw new NotFoundError('Side dish not found')
    }
    const products = await productModel.find({ sideDish_id: foundSideDish._id }).skip(skip).limit(limit)
    if(!products || products.length === 0){
        throw new NotFoundError('No products found in this side dish')
    }
    return products
}
module.exports = {
    createSideDishModel,
    findSideDishById,
    updateSideDishById,
    softDeleteSideDishById,
    listSideDishes,
    listDeletedSideDishes,
    restoreDeletedSideDishById,
    findProductsBySideDishId,
}