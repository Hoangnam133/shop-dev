const categoryService = require('../services/categoryService')
const {SuccessResponse} = require('../core/successResponse')

class CategoryController{
  
    createCategory = async (req, res, next) => {
        new SuccessResponse({
            message: 'Create category success',
            metaData: await categoryService.createCategory(req.body)
        }).send(res)
    }

    getAllCategories = async (req, res, next) =>{
        new SuccessResponse({
            message: 'Get all categories success',
            metaData: await categoryService.getAllCategories()
        }).send(res)
    }
      
    getCategoryById = async (req, res, next) =>{
        new SuccessResponse({
            message: 'Get category by ID success',
            metaData: await categoryService.getCategoryById(req.params.category_id)
        }).send(res)
    }
       
    updateCategoryById = async (req, res, next) =>{
        new SuccessResponse({
            message: 'Update category success',
            metaData: await categoryService.updateCategoryById({
                category_id: req.params.category_id,
                payload: req.body
            })
        }).send(res)
    }

    deleteCategoryById = async (req, res, next) =>{
        new SuccessResponse({
            message: 'Delete category success',
            metaData: await categoryService.deleteCategoryById(req.params.category_id)
        }).send(res)
    }
     

    publishCategoryById = async (req, res, next) =>{
        new SuccessResponse({
            message: 'Publish category success',
            metaData: await categoryService.publishCategoryById(req.params.category_id)
        }).send(res)
    }

    getAllCategoriesIsPublished = async (req, res, next) =>{
        new SuccessResponse({
            message: 'Get all categories success',
            metaData: await categoryService.getAllCategoriesIsPublished()
        }).send(res)
    }

    getAllCategoriesIsDeleted = async (req, res, next) =>{
        new SuccessResponse({
            message: 'Get all categories success',
            metaData: await categoryService.getAllCategoriesIsDeleted()
        }).send(res)
    }

    getLatestCategories = async (req, res, next) =>{
        const limit = parseInt(req.query.limit) || 10
        new SuccessResponse({
            message: 'Get latest categories success',
            metaData: await categoryService.getLatestCategories(limit)
        }).send(res)
    }
    
}
module.exports = new CategoryController()