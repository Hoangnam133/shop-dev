const productService = require("../services/productService");
const { SuccessResponse } = require("../core/successResponse");
class ProductController {
  createProduct = async (req, res, next) => {
    new SuccessResponse({
      message: "Create product success",
      metaData: await productService.createProduct(req.body),
    }).send(res);
  };

  updateProduct = async (req, res, next) => {
    const { product_id } = req.params;
    new SuccessResponse({
      message: "Update product success",
      metaData: await productService.updateProduct({
        user: req.user,
        product_id,
        payload: req.body,
      }),
    }).send(res);
  };

  deleteProduct = async (req, res, next) => {
    const { product_id } = req.params;
    await productService.updateDeleteProduct(product_id);
    new SuccessResponse({
      message: "Delete product success",
    }).send(res);
  };

  publishProduct = async (req, res, next) => {
    const { product_id } = req.params;
    new SuccessResponse({
      message: "Publish product success",
      metaData: await productService.updatePublishProduct(product_id),
    }).send(res);
  };

  // getAllProducts = async (req, res, next) => {
  //     const { limit, sort, page, filter } = req.query
  //     new SuccessResponse({
  //         message: 'Fetched all products successfully',
  //         metaData: await productService.getAllProduct({ limit, sort, page, filter })
  //     }).send(res)
  // }

  getAllProductsByShopId = async (req, res, next) => {
    const { shop_id } = req.params;
    const { limit, page } = req.query;
    new SuccessResponse({
      message: "Fetched products by shop ID successfully",
      metaData: await productService.getAllProductsByShopId({
        shop_id,
        limit,
        page,
      }),
    }).send(res);
  };

  getProductById = async (req, res, next) => {
    const { product_id } = req.params;
    const product = await productService.getProductById(product_id);
    new SuccessResponse({
      message: "Fetched product successfully",
      metaData: product,
    }).send(res);
  };

  getProductsByCategory = async (req, res, next) => {
    const { limit, page, category_id } = req.query;
    const { shop_id } = req.params;
    new SuccessResponse({
      message: "Fetched products by category successfully",
      metaData: await productService.getProductsByCategory({
        category_id,
        limit,
        page,
        shop_id,
      }),
    }).send(res);
  };

  searchProductByUser = async (req, res, next) => {
    const { keySearch } = req.query;
    new SuccessResponse({
      message: "Searched products successfully",
      metaData: await productService.searchProductByUser({ keySearch }),
    }).send(res);
  };
  getPublishedProductsManage = async (req, res, next) => {
    const { limit, page } = req.query;
    new SuccessResponse({
      message: "Fetched published products successfully",
      metaData: await productService.getPublishedProductsManage({
        limit,
        page,
        shop_id: req.shop._id,
      }),
    }).send(res);
  };
  getPublishedProducts = async (req, res, next) => {
    const { limit, page } = req.query;
    new SuccessResponse({
      message: "Fetched published products successfully",
      metaData: await productService.getPublishedProducts({ limit, page }),
    }).send(res);
  };

  getDeletedProducts = async (req, res, next) => {
    const { limit, page } = req.query;
    new SuccessResponse({
      message: "Fetched deleted products successfully",
      metaData: await productService.getDeletedProducts({ limit, page }),
    }).send(res);
  };
  getDeletedProductsManage = async (req, res, next) => {
    const { limit, page } = req.query;
    new SuccessResponse({
      message: "Fetched list delete products successfully",
      metaData: await productService.getDeletedProductsManage({
        limit,
        page,
        shop_id: req.shop._id,
      }),
    }).send(res);
  };
  // Controller
  getProductsSortedByRating = async (req, res, next) => {
    const { page, limit, sortOrder = 1 } = req.query; // Thêm sortOrder vào query
    new SuccessResponse({
      message: "Fetched products sorted by rating successfully",
      metaData: await productService.getProductsSortedByRating({
        page,
        limit,
        sortOrder,
        shop_id: req.shop._id,
      }),
    }).send(res);
  };

  getProductsSortedByPrice = async (req, res, next) => {
    const { sortOrder = 1, page, limit } = req.query; // Mặc định sortOrder là 1 (tăng dần)
    new SuccessResponse({
      message: "Fetched products sorted by price successfully",
      metaData: await productService.getProductsSortedByPrice({
        sortOrder,
        page,
        limit,
        shop_id: req.shop._id,
      }),
    }).send(res);
  };

  getLatestProducts = async (req, res, next) => {
    const { limit } = req.query;
    new SuccessResponse({
      message: "Fetched latest products successfully",
      metaData: await productService.getLatestProducts({
        limit,
        shop_id: req.shop._id,
      }),
    }).send(res);
  };

  getProductsSortedBysales_count = async (req, res, next) => {
    const { shop_id } = req.params;
    new SuccessResponse({
      message: "Fetched products sorted by sales count successfully",
      metaData: await productService.getProductsSortedBysales_count({
        shop_id,
      }),
    }).send(res);
  };
}
module.exports = new ProductController();
