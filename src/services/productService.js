const { NotFoundError, BadRequestError } = require('../core/errorResponse')
const productModel = require('../models/productModel')
const userModel = require('../models/userModel')
const {
    createProduct,
    updateProduct,
    updateDeleteProduct,
    updatePublishProduct,
    getAllProduct,
    getAllProductsByShopId,
    getProductsSortedByRatingDesc,
    getPublishedProducts,
    getDeletedProducts,
    getProductsByCategory,
    searchProductByUser,
    getProductsSortedByPrice,
    getLatestProducts,
    getProductsSortedBysales_count
} = require('../repositories/productRepository')
const { getInfoData, toObjectId } = require('../utils/index')
class ProductService{
    static async createProduct(payload) {
        return await createProduct(payload)
    }

    static async updateProduct({ user, product_id, payload }) {
        return await updateProduct({ user, productId: product_id, updateData: payload })
    }

    static async updateDeleteProduct(product_id) {
        return await updateDeleteProduct(product_id)
    }

    static async updatePublishProduct(product_id) {
        return await updatePublishProduct(product_id)
    }

    static async getAllProduct({ limit = 10, sort = 'ctime', page = 1, filter }) {
        return await getAllProduct({ limit, sort, page, filter })
    }

    static async getProductById(product_id) {
        const product = await getProductById(product_id);
        if (!product) {
            throw new NotFoundError('Product not found')
        }
        return product
    }

    static async getProductsByCategory({ category_id, limit = 10, page = 1 }) {
        return await getProductsByCategory({ category_id, limit, page })
    }

    static async searchProductByUser({ keySearch }) {
        return await searchProductByUser({ keySearch })
    }

    static async getPublishedProducts({ limit = 10, page = 1 }) {
        return await getPublishedProducts({ limit, page })
    }

    static async getDeletedProducts({ limit = 10, page = 1 }) {
        return await getDeletedProducts({ limit, page })
    }

    static async getProductsSortedByRatingDesc({ sortOrder = 'asc', page = 10, limit = 1, shop_id }) {
        return await getProductsSortedByRatingDesc({ sortOrder, page, limit, shop_id })
    }

    static async getProductsSortedByPrice({ sortOrder = 'asc', page = 1, limit = 10, shop_id }) {
        return await getProductsSortedByPrice({ sortOrder, page, limit, shop_id })
    }

    static async getLatestProducts(limit = 10) {
        return await getLatestProducts(limit)
    }

    static async getProductsSortedBysales_count({ shop_id }) {
        return await getProductsSortedBysales_count({ shop_id })
    }

    static async getDeletedProducts({ limit = 10, page = 1 }) {
        return await getDeletedProducts({ limit, page });
    }

    static async getAllProductsByShopId({ shop_id, limit = 10, sort, page = 1 }) {
        return await getAllProductsByShopId({ shop_id, limit, sort, page })
    }
}
module.exports = ProductService
