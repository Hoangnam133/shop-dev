const { NotFoundError, BadRequestError } = require("../core/errorResponse");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const {
  createProduct,
  updateProduct,
  updateDeleteProduct,
  updatePublishProduct,
  // getAllProduct,
  getProductById,
  getAllProductsByShopId,
  getProductsSortedByRating,
  getPublishedProducts,
  getPublishedProductsManage,
  getDeletedProducts,
  getProductsByCategory,
  searchProductByUser,
  getProductsSortedByPrice,
  getLatestProducts,
  getProductsSortedBysales_count,
  getDeletedProductsManage,
} = require("../repositories/productRepository");
const { getInfoData, toObjectId } = require("../utils/index");
class ProductService {
  static async createProduct(payload) {
    return await createProduct(payload);
  }
  static async updateProduct({ user, product_id, payload }) {
    return await updateProduct({ user, product_id, updateData: payload });
  }
  static async getPublishedProductsManage({ limit, page, shop_id }) {
    return await getPublishedProductsManage({ limit, page, shop_id });
  }
  static async getDeletedProductsManage({ limit, page, shop_id }) {
    return await getDeletedProductsManage({ limit, page, shop_id });
  }
  static async updateDeleteProduct(product_id) {
    return await updateDeleteProduct(product_id);
  }

  static async updatePublishProduct(product_id) {
    return await updatePublishProduct(product_id);
  }

  // static async getAllProduct({ limit = 10, sort = 'ctime', page = 1, filter }) {
  //     return await getAllProduct({ limit, sort, page, filter })
  // }

  static async getProductById(product_id) {
    const product = await getProductById(product_id);
    if (!product) {
      throw new NotFoundError("Product not found");
    }
    return product;
  }

  static async getProductsByCategory({
    category_id,
    limit = 10,
    page = 1,
    shop_id,
  }) {
    return await getProductsByCategory({ category_id, limit, page, shop_id });
  }

  static async searchProductByUser(keySearch ) {
    return await searchProductByUser( keySearch );
  }

  static async getPublishedProducts({ limit = 10, page = 1 }) {
    return await getPublishedProducts({ limit, page });
  }

  static async getDeletedProducts({ limit = 10, page = 1 }) {
    return await getDeletedProducts({ limit, page });
  }

  static async getProductsSortedByRating({
    page = 1,
    limit = 10,
    sortOrder = 1,
    shop_id,
  }) {
    return await getProductsSortedByRating({
      page,
      limit,
      sortOrder,
      shop_id,
    });
  }

  static async getProductsSortedByPrice({
    sortOrder = 1,
    page = 1,
    limit = 10,
    shop_id,
  }) {
    return await getProductsSortedByPrice({ sortOrder, page, limit, shop_id });
  }

  static async getLatestProducts({ limit = 10, shop_id }) {
    return await getLatestProducts({ limit, shop_id });
  }

  static async getProductsSortedBysales_count({ shop_id }) {
    return await getProductsSortedBysales_count({ shop_id });
  }

  static async getDeletedProducts({ limit = 10, page = 1 }) {
    return await getDeletedProducts({ limit, page });
  }

  static async getAllProductsByShopId({ shop_id, limit = 10, page = 1 }) {
    return await getAllProductsByShopId({ shop_id, limit, page });
  }
}
module.exports = ProductService;
