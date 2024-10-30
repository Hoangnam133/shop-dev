const categoryService = require('../services/categoryService')
const {SuccessResponse} = require('../core/successResponse')

class CategoryController{
    createCategory = async(req, res, next)=>{
        new SuccessResponse({
            message: 'create category success',
            metaData: await categoryService.createCategory({
                user: req.user,
                ...req.body
            })
        }).send(res)
    }
    updateCategory = async(req, res, next)=>{
        new SuccessResponse({
            message: 'update category success',
            metaData: await categoryService.updateCategory({
                category_id: req.params.category_id,
                user: req.user,
                payload: req.body
            })
        }).send(res)
    }
    deleteCategory = async(req, res, next)=>{
        new SuccessResponse({
            message: 'delete category success',
            metaData: await categoryService.deleteCategory(req.params.id_type)
        }).send(res)
    }
    publishCategory = async(req, res, next)=>{
        new SuccessResponse({
            message: 'publish category success',
            metaData: await categoryService.publishCategory(req.params.id_type)
        }).send(res)
    }
    showAllUnpublishCategories = async(req, res, next)=>{
        new SuccessResponse({
            message: 'show list unpublish category success',
            metaData: await categoryService.showAllUnpublishCategories(req.user)
        }).send(res)
    }
    showAllPublishCategories = async(req, res, next)=>{
        new SuccessResponse({
            message: 'show list publish category success',
            metaData: await categoryService.showAllPublishCategories()
        }).send(res)
    }
    showAllDeletedCategories = async(req, res, next)=>{
        new SuccessResponse({
            message: 'show list deleted category success',
            metaData: await categoryService.showAllDeletedCategories(req.user)
        }).send(res)
    }
    getAllSubCategories = async(req, res, next)=>{
        new SuccessResponse({
            message: 'get getAllSubCategories of category success',
            metaData: await categoryService.subCategoriesofCategory(req.params.category_id)
        }).send(res)
    }


}
module.exports = new CategoryController()