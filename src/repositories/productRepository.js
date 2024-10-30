const productModel = require('../models/productModel')
const categoryModel = require('../models/categoryModel')
const {BadRequestError, NotFoundError} = require('../core/errorResponse')
const {removeUndefinedObject} = require('../utils/index')
const cartModel = require('../models/cartModel')
const shopModel = require('../models/shopModel')
const userModel = require('../models/userModel')
const {toObjectId} = require('../utils/index')
const slugify = require('slugify')
const { find } = require('lodash')
const createProduct = async({body})=>{
    const {product_name, product_thumb,
        product_description, product_price, ingredients, serving_size
        , subCategory_id, product_ratingAverage, isDraft = true, isPublished = false,
        preparation_time, product_usage} = body
        const foundSubCategory = await subCategoryModel.find({
            _id: subCategory_id,
            publish: true,
            draft: false,
            isDelete: false
        })
        if(!foundSubCategory){
            throw new NotFoundError('not found Sub Category')
        }
        const foundProduct = await productModel.findOne({
            product_name: { $regex: new RegExp(`^${product_name}$`, 'i') }
        });
        
        if (foundProduct) {
            throw new BadRequestError('This product name already exists')
        }
        const newProduct = await productModel.create({
            product_name,
            product_thumb,
            product_description,
            product_price,
            product_ratingAverage,
            product_usage,
            product_thumb,
            isDraft,
            isPublished,
            preparation_time,
            subCategory_id,
            serving_size,
            ingredients
        })
    return newProduct
}
const findAllProduct = async({limit, sort, page, filter})=>{
    const skip = (page - 1)*limit
    const sortBy  = sort === 'ctime' ? {_id: -1} : {_id: 1}
    const products = await productModel.find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .lean()
    if(!products){
        throw new NotFoundError(' not found products')
    }
    return products
}
const findProductsBySubCategory = async ({ subCategory_id, limit, page }) => {
    const skip = (page - 1) * limit
    const products = await productModel.find({ subCategory_id })
        .skip(skip)
        .limit(limit)
        .lean()
    if(!products){
        throw new NotFoundError(' not found products')
    }
    return products
}
const findDraftProducts = async ({ limit , page }) => {
    const skip = (page - 1) * limit
    const products = await productModel.find({ isDraft: true })
        .skip(skip)
        .limit(limit)
        .lean()
    if(!products){
        throw new NotFoundError(' not found products')
    }
    return products
}
const findPublishedProducts = async ({ limit , page  }) => {
    const skip = (page - 1) * limit;
    const products = await productModel.find({ isPublished: true })
        .skip(skip)
        .limit(limit)
        .lean()
    if(!products){
        throw new NotFoundError(' not found products')
    }
    return products
}
const findDeletedProducts = async ({ limit , page  }) => {
    const skip = (page - 1) * limit;
    const products = await productModel.find({ isDeleted: true })
        .skip(skip)
        .limit(limit)
        .lean()
    if(!products){
        throw new NotFoundError(' not found products')
    }
    return products
}
const findProductsByLargeCategory = async ({Category_id, limit, page}) => {
    const largeCategory = await categoryModel.findOne({ _id: Category_id, publish: true, draft: false, isDelete: false }).lean()
    if (!largeCategory) {
        throw new NotFoundError('not found caterogry')
    }
    const subCategories = await subCategoryModel.find({ parentCategory: largeCategory._id, publish: true, draft: false, isDelete: false }).lean()
    const subCategoryIds = subCategories.map(cat => cat._id)
    const skip = (page - 1) * limit;
    const products = await productModel.find({ subCategory_id: { $in: subCategoryIds } })
        .skip(skip)
        .limit(limit)
        .lean();
    if(!products){
        throw new NotFoundError(' not found products')
    }
    return products
}
const updatePublishProduct = async(product_id)=>{
    const updateProduct = await productModel.findByIdAndUpdate(product_id,{
        $set:{
            isPublished: true,
            isDraft: false,
            isDelete: false
        }
    },{
        new: true,
        lean: true
    })
    if (!updateProduct) {
        throw new NotFoundError('Product not found')
    }
    return updateProduct
}
const updateProduct = async({user,productId, updateData})=>{
    if (!user) {
        throw new BadRequestError('User not found')
    }
    const foundShop = await shopModel.findOne({ shop_owner: user._id }).lean()
    if (!foundShop) throw new NotFoundError('Shop not found')
    if (updateData.product_name && updateData.product_name.trim() !== '') {
        const existingProduct= await productModel.findOne({
            meals: { $regex: new RegExp(`^${updateData.product_name}$`, 'i') },
            _id: { $ne: toObjectId(productId.toString()) }
        }).lean()
        if (existingProduct) {
            throw new BadRequestError('This product name already exists')
        }
    }
    const cleanDateBeforeUpdate = removeUndefinedObject(updateData)
    const updateProduct = await productModel.findByIdAndUpdate(productId, cleanDateBeforeUpdate,{
        new: true,
        lean: true,
    })
    console.log('Update Product ID:', updateProduct._id);
    if(updateProduct.isDelete || !updateProduct.isPublished){
        await processProductUnPublishOrDeleteFromAdmin(updateProduct._id)
    }
    if (!updateProduct) {
        throw new NotFoundError('Product not found')
    }
    return updateProduct
}

const processProductUnPublishOrDeleteFromAdmin = async(product_id)=>{
    try{
        const updatedCarts = await cartModel.updateMany({
            'cart_products.productId': product_id
        },{
            $set:{
                'cart_products.$.isDelete': true
            }
        })
        if(updatedCarts.matchedCount === 0) {
            console.log('No carts found with the product')
        }
        const userFavorites = await userModel.updateMany(
            { favorites: product_id },
            { $pull: { favorites: product_id } }
        );
        
        if (userFavorites.matchedCount > 0 && userFavorites.modifiedCount > 0) {
            console.log('remove product from favorites success');
        } else {
            console.log('No users had this product in their favorites, or nothing was modified.');
        }        
    }catch(error){
        console.error('Error in processProductUnpublishOrDeleteFromAdmin', error)
        throw new BadRequestError(error.mesage)
    }
}
const updateDeleteProduct = async(product_id)=>{
    const updateProduct = await productModel.findByIdAndUpdate(product_id,{
        $set:{
            isDelete: true
        }
    },{
        new: true,
        lean: true
    })
    if (!updateProduct) {
        throw new NotFoundError('Product not found')
    }
    
    return updateProduct
}
const searchProductByUser = async ({ keySearch }) => {
    console.log(`keySearch:::${keySearch}`);
    const regex = new RegExp(keySearch, 'i'); 

    const results = await productModel.find({
        isPublished: true,
        isDelete: false,
        isDraft: false,
        product_name: { $regex: regex } 
    })
    .limit(5)
    .lean()
    if (!results || results.length === 0) {
        throw new NotFoundError('Product not found');
    }
    return results
}

const getProductById = async(product_id)=>{
    return await productModel.findById(product_id)
}
module.exports = {
   createProduct,
   getProductById,
   updateProduct,
   updateDeleteProduct,
   updatePublishProduct,
   findAllProduct,
   findDeletedProducts,
   findDraftProducts,
   findProductsByLargeCategory,
   findProductsBySubCategory,
   findPublishedProducts,
   searchProductByUser

}