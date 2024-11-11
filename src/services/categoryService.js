const { BadRequestError, NotFoundError } = require('../core/errorResponse')
const categoryModel = require('../models/categoryModel')
const {createCategory,
    getAllCategories,
    getCategoryById,
    updateCategoryById,
    deleteCategoryById,
    publishCategoryById,
    getAllCategoriesIsPublished,
    getAllCategoriesIsDeleted,
    getLatestCategories} = require('../repositories/categoryRepository')

class CategoryService {
    static async createCategory(payload, file){   
        return await createCategory(payload, file)
    }
    static async getAllCategories(){
        return await getAllCategories()
    }
    static async getCategoryById(categoryId){
        return await getCategoryById(categoryId)
    }
    static async updateCategoryById({category_id, payload, file}){
        return await updateCategoryById({category_id, payload, file})
    }
    static async deleteCategoryById(category_id){
        return await deleteCategoryById(category_id)
    }
    static async publishCategoryById(category_id){
        return await publishCategoryById(category_id)
    }
    static async getAllCategoriesIsPublished(){
        return await getAllCategoriesIsPublished()
    }
    static async getAllCategoriesIsDeleted(){
        return await getAllCategoriesIsDeleted()
    }
    static async getLatestCategories(limit = 10){
        return await getLatestCategories(limit)
    }
}

module.exports = CategoryService
