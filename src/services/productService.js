const { NotFoundError, BadRequestError } = require('../core/errorResponse')
const inventoryModel = require('../models/inventoryModel')
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const {createProduct, updateProduct, updateDeleteProduct, updatePublishProduct,
    findAllProduct, findDeletedProducts, findDraftProducts, findProductsByLargeCategory,
    findProductsBySubCategory, searchProductByUser
} = require('../repositories/productRepository')
const { getInfoData, toObjectId } = require('../utils/index')
class ProductService{
    static createProduct = async(body)=>{
        const {inven_stock} = body
        const newProduct = await createProduct({body})
        if(!newProduct){
            throw new BadRequestError('create product fail')
        }
        await inventoryModel.create({
            inven_stock,
            inven_productId: newProduct._id
        })
        return product
    }
    static updateProduct = async({user,productId, updateData})=>{
        return await updateProduct({user ,productId, updateData})
    }
    static findProductById = async({product_id, user})=>{
        let checkFavorites = false
        if(!user){
            throw new BadRequestError('User not found')
        }
        if(!product_id ){
            throw new BadRequestError('product_id not found')
        }
        const findProduct = await productModel.findById(toObjectId(product_id.trim().toString()))
        const userFavorites = await userModel.find({
            _id: user._id,
            favorites: findProduct._id
        })
        if(userFavorites.length > 0){
            checkFavorites = true
        }
        else{
            checkFavorites = false
        }
        return{
            product,
            favorites: checkFavorites
        }
    }
    static updateDeleteProduct = async(product_id)=>{
        return await updateDeleteProduct(product_id)
    }
    static updatePublishProduct = async(product_id)=>{
        return await updatePublishProduct(product_id)
    }
    static findAllProduct = async({limit = 10, sort = 'ctime', page = 1})=>{
        const filter = { isPublished: true }
        return await findAllProduct({limit, sort, page, filter})
    }
    static findDeletedProducts = async({limit = 9, page = 1})=>{
        return await findDeletedProducts({limit, page})
    }
    static findDraftProducts = async({limit = 9, page = 1})=>{
        return await findDraftProducts({limit, page})
    }
    static findProductsByLargeCategory = async({Category_id, limit = 10, page = 1})=>{
        return await findProductsByLargeCategory({Category_id, limit, page})
    }
    static findProductsBySubCategory = async({ subCategory_id, limit = 10, page = 1 })=>{
        return await findProductsBySubCategory({ subCategory_id, limit, page })
    }
    static searchProductByUser = async({keySearch})=>{
        console.log(`keysearch service::: ${keySearch}`)
        return await searchProductByUser({keySearch})
    }

}
module.exports = ProductService
