const { BadRequestError, NotFoundError } = require('../core/errorResponse')
const categoryModel = require('../models/categoryModel')
const shopModel = require('../models/shopModel')
const { getInfoData, removeUndefinedObject,  toObjectId } = require('../utils')

class CategoryService {
    static createCategory = async ({ user, meals }) => {
        if (!user) {
            throw new BadRequestError('User not found')
        }
        if (!meals || meals.trim() === '') {
            throw new BadRequestError('Meals name is required')
        }

        const foundShop = await shopModel.findOne({ shop_owner: user._id }).lean()
        if (!foundShop) throw new NotFoundError('Shop not found')

        const existingCategory = await categoryModel.findOne({
            meals: { $regex: new RegExp(`^${meals}$`, 'i') }
        }).lean()
        
        if (existingCategory) {
            throw new BadRequestError('This category name already exists')
        }

        const newCategory = await categoryModel.create({
            meals,
            shop_id: foundShop._id
        });

        return category
        
    }

    static showAllUnpublishCategories = async (user) => {
        if (!user) throw new BadRequestError('User not found')
        const foundShop = await shopModel.findOne({ shop_owner: user._id }).lean()
        if (!foundShop) throw new NotFoundError('Shop not found')

        return await categoryModel.find({
            draft: true,
            isDelete: false,
            publish: false
        }).lean()
    }

    static showAllPublishCategories = async () => {
        return await categoryModel.find({
            draft: false,
            isDelete: false,
            publish: true
        }).lean()
    }

    static showAllDeletedCategories = async (user) => {
        if (!user) throw new BadRequestError('User not found')
        const foundShop = await shopModel.findOne({ shop_owner: user._id }).lean()
        if (!foundShop) throw new NotFoundError('Shop not found')

        return await categoryModel.find({
            draft: true,
            isDelete: true,
            publish: false
        }).lean()
    }

    static deleteCategory = async (id_type) => {

        const deleteCategory = await categoryModel.findByIdAndUpdate(id_type, {
            $set: { isDelete: true }
        }, { new: true }).lean()

        if (!deleteCategory) {
            throw new BadRequestError('Delete category failed');
        }

        return deleteCategory
    }

    static publishCategory = async (id_type) => {
        const updateCategory = await categoryModel.findByIdAndUpdate(id_type, {
            $set: {
                draft: false,
                publish: true,
                isDelete: false
            }
        }, { new: true }).lean()

        if (!updateCategory) {
            throw new BadRequestError('Update failed')
        }

        return updateCategory
    }

    static subCategoriesofCategory = async (category_id) => {
        const getSubCategories = await subCategoryModel.find({
            parentCategory: category_id,
            isDelete: false,
            draft: false,
            publish: true
        }).lean()

        if (!getSubCategories || getSubCategories.length === 0) {
            throw new NotFoundError('No subcategories found for this category')
        }

        return getSubCategories
    }

    static updateCategory = async ({ category_id, payload, user }) => {
        if (!user) {
            throw new BadRequestError('User not found')
        }
        const foundShop = await shopModel.findOne({ shop_owner: user._id }).lean()
        if (!foundShop) throw new NotFoundError('Shop not found')
        if (payload.meals && payload.meals.trim() !== '') {
            const existingCategory = await categoryModel.findOne({
                meals: { $regex: new RegExp(`^${payload.meals}$`, 'i') },
                _id: { $ne: toObjectId(category_id.toString()) }
            }).lean()
            if (existingCategory) {
                throw new BadRequestError('This category name already exists')
            }
        }
        const cleanedPayload = removeUndefinedObject(payload);
        const updateCategory = await categoryModel.findByIdAndUpdate(toObjectId(category_id.toString()), cleanedPayload, { new: true }).lean()
        if (!updateCategory) {
            throw new BadRequestError('Update category failed')
        }

        return updateCategory
    }
    
}

module.exports = CategoryService
