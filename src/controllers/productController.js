const productService = require('../services/productService')
const {SuccessResponse} = require('../core/successResponse')
class ProductController {
    createProduct = async(req, res, next)=>{
        new SuccessResponse({
            message: 'create product success',
            metaData: await productService.createProduct(req.body)
        }).send(res)
    }
    findProductById = async(req, res, next)=>{
        new SuccessResponse({
            message: 'create product success',
            metaData: await productService.findProductById({
                user: req.user,
                product_id: req.params.product_id
            })
        }).send(res)
    }
    updateProduct = async(req, res, next)=>{
        new SuccessResponse({
            message: 'update product success',
            metaData: await productService.updateProduct({
                productId: req.params.productId,
                updateData: req.body,
                user: req.user
            })
        }).send(res)
    }
    deleteProduct = async(req, res, next)=>{
        new SuccessResponse({
            message: 'delete product success',
            metaData: await productService.updateDeleteProduct(req.params.product_id)
        }).send(res)
    }
    publishProduct = async(req, res, next)=>{
        new SuccessResponse({
            message: 'publish product success',
            metaData: await productService.updatePublishProduct(req.params.product_id)
        }).send(res)
    }
    findAllProduct = async(req, res, next)=>{
        new SuccessResponse({
            message: 'get list product success',
            metaData: await productService.findAllProduct(req.query)
        }).send(res)
    }
    findDeletedProducts = async(req, res, next)=>{
        new SuccessResponse({
            message: 'get list deleted product success',
            metaData: await productService.findDeletedProducts(req.query)
        }).send(res)
    }
    findDraftProducts = async(req, res, next)=>{
        new SuccessResponse({
            message: 'get list draft product success',
            metaData: await productService.findDraftProducts(req.query)
        }).send(res)
    }
    findProductsByLargeCategory = async(req, res, next)=>{
        const limit = parseInt(req.query.limit) || 10
        const page = parseInt(req.query.page) || 1
        new SuccessResponse({
            message: 'get list product by category success',
            metaData: await productService.findProductsByLargeCategory({
                limit, page, Category_id: req.params.Category_id
            })
        }).send(res)
    }
    findProductsBySubCategory = async(req, res, next)=>{
        const limit = parseInt(req.query.limit) || 10
        const page = parseInt(req.query.page) || 1
        new SuccessResponse({
            message: 'get list product by category success',
            metaData: await productService.findProductsBySubCategory({
                limit, page, subCategory_id: req.params.subCategory_id
            })
        }).send(res)
    }
    searchProductByUser = async(req, res, next)=>{
        const keySearch = req.query.keySearch
        console.log(keySearch)
        new SuccessResponse({
            message: 'search product success',
            metaData: await productService.searchProductByUser({keySearch})
        }).send(res)
    }
}
module.exports = new ProductController()