const productModel = require("../models/productModel");
const mongoose = require("mongoose");
const categoryModel = require("../models/categoryModel");
const { BadRequestError, NotFoundError } = require("../core/errorResponse");
const { removeUndefinedObject } = require("../utils/index");
const userModel = require("../models/userModel");
const shopModel = require("../models/shopModel");
const cartModel = require("../models/cartModel");
const inventoryModel = require("../models/inventoryModel");
const { toObjectId } = require("../utils/index");
const { forEach } = require("lodash");
const shopProductModel = require("../models/shopProductModel");
const checkShop = async (shop_id) => {
  if (!shop_id) {
    throw new BadRequestError("Shop ID is required");
  }
  const objShop_id = toObjectId(shop_id);
  const foundShop = await shopModel.findById(objShop_id);
  if (!foundShop) {
    throw new NotFoundError("Shop not found");
  }
  return foundShop;
};
const createProduct = async (payload) => {
  const { category_id, shop_id, sideDish_id } = payload;

  const findcategory = await categoryModel.findById(
    toObjectId(category_id.trim())
  );
  if (!findcategory) {
    throw new NotFoundError("Category not found");
  }

  const shopIdsArray = Array.isArray(shop_id) ? shop_id : [shop_id];
  if (shopIdsArray.length === 0) {
    throw new BadRequestError("shop_ids cannot be empty");
  }

  const shopObjectIds = shopIdsArray.map((id) => toObjectId(id.trim()));

  const getAllShop = await shopModel.find(
    { _id: { $in: shopObjectIds } },
    "_id"
  );
  if (getAllShop.length !== shopIdsArray.length) {
    throw new BadRequestError("One or more shop_ids are not valid");
  }

  // Kiểm tra và chuyển đổi `sideDish_id` thành mảng ObjectId hợp lệ
  const sideDishObjectIds = Array.isArray(sideDish_id)
    ? sideDish_id
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id)) // Lọc ra những ID hợp lệ
        .map((id) => toObjectId(id)) // Chuyển thành ObjectId
    : [];

  // Cập nhật payload với mảng ObjectId của `sideDish_id`
  const updatedPayload = { ...payload, sideDish_id: sideDishObjectIds };

  const newProduct = await productModel.create(updatedPayload);
  if (!newProduct) {
    throw new BadRequestError("Failed to create product");
  }

  for (const shop_id of shopObjectIds) {
    await shopProductModel.create({
      shop_id,
      product_id: newProduct._id,
    });
  }

  return newProduct;
};

const getLatestProducts = async ({ limit = 10, shop_id }) => {
  const products = await shopProductModel
    .find({
      isPublished: true,
      isDeleted: false,
      shop_id: toObjectId(shop_id),
    })
    .sort({ createdAt: -1 })
    .populate("product_id")
    .limit(limit);
  console.log(products);

  if (!products) {
    throw new NotFoundError(" not found products");
  }
  return products;
};
const getProductsSortedBysales_count = async ({ shop_id }) => {
  const checkShopId = await checkShop(shop_id);
  if (!checkShopId) {
    throw new NotFoundError("Shop not found");
  }

  const objShop_id = toObjectId(shop_id);

  const shopProducts = await shopProductModel
    .find({ isPublished: true, isDeleted: false, shop_id: objShop_id })
    .populate({
      path: "product_id",
      select:
        "product_name product_thumb product_description ingredients category_id product_slug product_ratingAverage review_count preparation_time product_usage product_price required_points sideDish_id createdAt updatedAt",
    })
    .sort({ sales_count: -1 });

  if (!shopProducts || shopProducts.length === 0) {
    throw new NotFoundError("No products found");
  }

  // Trả về chỉ dữ liệu sản phẩm từ `product_id`
  const products = shopProducts.map((sp) => sp.product_id);

  return products;
};

const getProductsSortedByPrice = async ({
  sortOrder = 1,
  page = 1,
  limit = 10,
  shop_id,
}) => {
  const checkShopId = await checkShop(shop_id);
  if (!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  const objShop_id = toObjectId(shop_id);

  const shopProducts = await shopProductModel
    .find({ shop_id: objShop_id, isPublished: true, isDeleted: false })
    .populate({
      path: "product_id",
      select: "product_name product_price product_description",
    })
    .limit(limit)
    .skip((page - 1) * limit);

  // Lấy thông tin sản phẩm và sắp xếp theo product_price
  const products = shopProducts
    .map((sp) => sp.product_id)
    .filter((product) => product !== null)
    .sort((a, b) =>
      sortOrder == 1
        ? a.product_price - b.product_price
        : b.product_price - a.product_price
    ); // Sắp xếp theo giá

  if (!products || products.length === 0) {
    throw new NotFoundError("No products found");
  }

  return products;
};

const getProductsSortedByRating = async ({
  page = 1,
  limit = 10,
  sortOrder = 1,
  shop_id,
}) => {
  const checkShopId = await checkShop(shop_id);
  if (!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  const objShop_id = toObjectId(shop_id);

  const shopProducts = await shopProductModel
    .find({ shop_id: objShop_id, isPublished: true, isDeleted: false })
    .populate({
      path: "product_id",
      select:
        "product_name product_price product_description product_ratingAverage",
    })
    .limit(limit)
    .skip((page - 1) * limit);

  // Sắp xếp theo product_ratingAverage dựa trên giá trị sortOrder
  const products = shopProducts
    .map((sp) => sp.product_id)
    .filter((product) => product !== null)
    .sort((a, b) =>
      sortOrder == 1
        ? a.product_ratingAverage - b.product_ratingAverage
        : b.product_ratingAverage - a.product_ratingAverage
    );

  if (!products || products.length === 0) {
    throw new NotFoundError("No products found");
  }

  return products;
};

const getAllProductsByShopId = async ({ limit = 10, page = 1, shop_id }) => {
  const skip = (page - 1) * limit;
  const checkShopId = await checkShop(shop_id);
  if (!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  const objShop_id = toObjectId(shop_id.trim());
  const foundShop = await shopModel.findById(objShop_id);
  const shopProducts = await shopProductModel
    .find({ shop_id: objShop_id, isPublished: true, isDeleted: false })
    .populate("product_id")
    .limit(limit)
    .skip(skip);
  console.log(shopProducts);

  if (!shopProducts || shopProducts.length === 0) {
    throw new NotFoundError("No products found");
  }
  return shopProducts;
};

const getProductsByCategory = async ({
  category_id,
  limit = 10,
  page = 1,
  shop_id,
}) => {
  const skip = (page - 1) * limit;
  if (!category_id) {
    throw new BadRequestError("Category ID is required");
  }
  const checkShopId = await checkShop(shop_id);
  if (!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  // Bị trùng tên nên đổi
  // const category_id = toObjectId(category_id.trim());
  const categoryObjectId = toObjectId(category_id.trim());
  console.log(categoryObjectId);

  const existingCategory = await categoryModel.findById(categoryObjectId);
  console.log(existingCategory);

  if (!existingCategory) {
    throw new NotFoundError("Category not found");
  }
  const productIds = await productModel
    .find({ category_id: categoryObjectId })
    .distinct("_id");

  const products = await shopProductModel
    .find({
      shop_id: checkShopId._id,
      isPublished: true,
      isDeleted: false,
      product_id: { $in: productIds },
    })
    .populate("product_id")
    .limit(limit)
    .skip(skip);

  if (!products || products.length === 0) {
    throw new NotFoundError("No products found in this category");
  }

  return products;
};
//Admin only
const getPublishedProducts = async ({ limit, page }) => {
  const skip = (page - 1) * limit;
  const products = await productModel
    .find({ isPublished: true, isDeleted: false })
    .skip(skip)
    .limit(limit)
    .lean();
  console.log(products);

  if (!products) {
    throw new NotFoundError(" not found products");
  }

  return products;
};
// manage branch
const getPublishedProductsManage = async ({
  limit = 10,
  page = 1,
  shop_id,
}) => {
  const checkShopId = await checkShop(shop_id);
  if (!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  console.log(checkShopId);

  const skip = (page - 1) * limit;
  const products = await shopProductModel
    .find({ isPublished: true, isDeleted: false, shop_id: checkShopId._id })
    .populate("product_id")
    .skip(skip)
    .limit(limit)
    .lean();
  if (!products) {
    throw new NotFoundError(" not found products");
  }
  return products;
};
//Admin only
const getDeletedProducts = async ({ limit, page }) => {
  const skip = (page - 1) * limit;
  const products = await productModel
    .find({ isDeleted: true, isPublished: false })
    .skip(skip)
    .limit(limit)
    .lean();
  if (!products) {
    throw new NotFoundError(" not found products");
  }
  return products;
};
// manage branch
const getDeletedProductsManage = async ({ limit = 10, page = 1, shop_id }) => {
  const skip = (page - 1) * limit;
  const checkShopId = await checkShop(shop_id);
  if (!checkShopId) {
    throw new NotFoundError("Shop not found");
  }

  // Tìm kiếm sản phẩm đã bị xóa
  const products = await shopProductModel
    .find({ isDeleted: true, shop_id: checkShopId._id }) // Thay đổi điều kiện là isDeleted: true
    .populate("product_id")
    .skip(skip)
    .limit(limit)
    .lean();

  // Kiểm tra nếu không tìm thấy sản phẩm đã bị xóa
  if (products.length === 0) {
    throw new NotFoundError("There are no deleted products in the shop."); // Trả về mảng rỗng nếu không có sản phẩm nào đã bị xóa
  }

  return products;
};

// chưa hoàn thiện
const updatePublishProduct = async (product_id) => {
  const updateProduct = await productModel.findByIdAndUpdate(
    product_id,
    {
      $set: {
        isPublished: true,
      },
    },
    {
      new: true,
      lean: true,
    }
  );
  if (!updateProduct) {
    throw new NotFoundError("Product not found");
  }
  return updateProduct;
};
const updateProduct = async ({ user, product_id, updateData }) => {
  if (!user) {
    throw new BadRequestError("User not found");
  }
  const findUser = await userModel.findById(user._id);
  console.log(findUser);
  console.log(product_id);

  if (!findUser) throw new NotFoundError("User not found");
  if (updateData.product_name && updateData.product_name.trim() !== "") {
    const existingProduct = await productModel
      .findOne({
        meals: { $regex: new RegExp(`^${updateData.product_name}$`, "i") },
        _id: { $ne: toObjectId(product_id.toString()) },
      })
      .lean();
    if (existingProduct) {
      throw new BadRequestError("This product name already exists");
    }
  }
  const cleanDateBeforeUpdate = removeUndefinedObject(updateData);
  const updateProduct = await productModel.findByIdAndUpdate(
    product_id,
    cleanDateBeforeUpdate,
    {
      new: true,
      lean: true,
    }
  );
  console.log("Update Product ID:", updateProduct._id);
  if (updateProduct.isDelete || !updateProduct.isPublished) {
    await processProductUnPublishOrDeleteFromAdmin(updateProduct._id);
  }
  if (!updateProduct) {
    throw new NotFoundError("Product not found");
  }
  return updateProduct;
};

const processProductUnPublishOrDeleteFromAdmin = async (product_id) => {
  try {
    const updatedCarts = await cartModel.updateMany(
      {
        "cart_products.productId": product_id,
      },
      {
        $set: {
          "cart_products.$.isDelete": true,
        },
      }
    );
    if (updatedCarts.matchedCount === 0) {
      console.log("No carts found with the product");
    }
    const userFavorites = await userModel.updateMany(
      { favorites: product_id },
      { $pull: { favorites: product_id } }
    );

    if (userFavorites.matchedCount > 0 && userFavorites.modifiedCount > 0) {
      console.log("remove product from favorites success");
    } else {
      console.log(
        "No users had this product in their favorites, or nothing was modified."
      );
    }
  } catch (error) {
    console.error("Error in processProductUnpublishOrDeleteFromAdmin", error);
    throw new BadRequestError(error.mesage);
  }
};
const updateDeleteProduct = async (product_id) => {
  const updateProduct = await productModel.findByIdAndUpdate(
    product_id,
    {
      $set: {
        isDelete: true,
        isPublished: false,
      },
    },
    {
      new: true,
      lean: true,
    }
  );
  if (!updateProduct) {
    throw new NotFoundError("Product not found");
  }

  return updateProduct;
};
const searchProductByUser = async ({ keySearch }) => {
  // Xóa các ký tự xuống dòng và khoảng trắng dư thừa
  const sanitizedKeySearch = keySearch.trim().replace(/\s+/g, " ");
  console.log(`Sanitized keySearch:::${sanitizedKeySearch}`);

  const regex = new RegExp(sanitizedKeySearch, "i");

  const results = await productModel
    .find({
      product_name: { $regex: regex },
      isPublished: true,
      isDeleted: false,
    })
    .limit(5)
    .lean();

  console.log("Kết quả truy vấn:", results);

  if (!results || results.length === 0) {
    throw new NotFoundError("Product not found");
  }
  return results;
};

const getProductById = async (product_id) => {
  return await productModel.findById(product_id);
};

const getProductByIdOfShop = async (product_id) => {};
module.exports = {
  getProductById,
  createProduct,
  updateProduct,
  updateDeleteProduct,
  updatePublishProduct,
  getAllProductsByShopId,
  getProductsSortedByRating,
  getPublishedProducts,
  getDeletedProducts,
  getProductsByCategory,
  searchProductByUser,
  getProductsSortedByPrice,
  getLatestProducts,
  getProductsSortedBysales_count,
  getPublishedProductsManage,
  getDeletedProductsManage,
};
