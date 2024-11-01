const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const { BadRequestError, NotFoundError } = require("../core/errorResponse");
const { removeUndefinedObject } = require("../utils/index");
const userModel = require("../models/userModel");
const shopModel = require("../models/shopModel");
const cartModel = require("../models/cartModel");
const userModel = require("../models/userModel");
const inventoryModel = require("../models/inventoryModel");
const { toObjectId } = require("../utils/index");
const createProduct = async (payload) => {
  const { category_id } = payload;
  const findcategory = await categoryModel.findById(category_id);
  if (!findcategory) {
    throw new NotFoundError("Category not found");
  }
  const getAllShop = await shopModel.find({}, "_id");
  if (!getAllShop || getAllShop.length === 0) {
    throw new NotFoundError("No shop found");
  }
  const shopIds = getAllShop.map((shop) => shop._id);
  const newProduct = await productModel.create({
    category_id,
    ...payload,
    shop_id: shopIds,
  });
  if (!newProduct) {
    throw new BadRequestError("Failed to create product");
  }
  return newProduct;
};
const getLatestProducts = async (limit = 10) => {
  const products = await productModel
    .find({ isPublished: true })
    .sort({ createdAt: -1 })
    .limit(limit);
  if (!products) {
    throw new NotFoundError(" not found products");
  }
};
const getProductsSortedBysales_count = async ({ shop_id }) => {
  const products = await productModel
    .find({ isPublished: true, shop_id })
    .sort({ sales_count: -1 });
  if (!products) {
    throw new NotFoundError(" not found products");
  }
  return products;
};
const getProductsSortedByPrice = async ({
  sortOrder = "asc",
  page = 1,
  limit = 10,
  shop_id,
}) => {
  const products = await productModel
    .find({ isPublished: true, shop_id })
    .sort({ product_price: sortOrder === "asc" ? 1 : -1 })
    .limit(limit)
    .skip((page - 1) * limit);
  if (!products) {
    throw new NotFoundError(" not found products");
  }
};
const getProductsSortedByRatingDesc = async ({
  sortOrder = "asc",
  page = 1,
  limit = 10,
  shop_id,
}) => {
  const products = await productModel
    .find({ isPublished: true, shop_id })
    .sort({ product_ratingAverage: sortOrder === "asc" ? -1 : 1 })
    .limit(limit)
    .skip((page - 1) * limit);
  if (!products) {
    throw new NotFoundError(" not found products");
  }
};
const getAllProduct = async ({ limit, sort, page, filter }) => {
  const skip = (page - 1) * limit;
  const sortBy = sort === "ctime" ? { _id: -1 } : { _id: 1 };
  const products = await productModel
    .find({ filter })
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .lean();
  if (!products) {
    throw new NotFoundError(" not found products");
  }
  return products;
};
const getAllProductsByShopId = async ({ limit, sort, page, shop_id }) => {
  const skip = (page - 1) * limit;
  const sortBy = sort === "ctime" ? { _id: -1 } : { _id: 1 };
  const products = await productModel
    .find({ shop_id, isDelete: true, isDelete: false })
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .lean();
  if (!products) {
    throw new NotFoundError(" not found products");
  }
  return products;
};
const getProductsByCategory = async ({ category_id, limit, page }) => {
  const skip = (page - 1) * limit;
  const products = await productModel
    .find(category_id)
    .skip(skip)
    .limit(limit)
    .lean();
  if (!products) {
    throw new NotFoundError(" not found products");
  }
  return products;
};
const getPublishedProducts = async ({ limit, page }) => {
  const skip = (page - 1) * limit;
  const products = await productModel
    .find({ isPublished: true })
    .skip(skip)
    .limit(limit)
    .lean();
  if (!products) {
    throw new NotFoundError(" not found products");
  }
  return products;
};
const getDeletedProducts = async ({ limit, page }) => {
  const skip = (page - 1) * limit;
  const products = await productModel
    .find({ isDeleted: true })
    .skip(skip)
    .limit(limit)
    .lean();
  if (!products) {
    throw new NotFoundError(" not found products");
  }
  return products;
};
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
const updateProduct = async ({ user, productId, updateData }) => {
  if (!user) {
    throw new BadRequestError("User not found");
  }
  const findUser = await userModel.findById(user._id);
  if (!findUser) throw new NotFoundError("User not found");
  if (updateData.product_name && updateData.product_name.trim() !== "") {
    const existingProduct = await productModel
      .findOne({
        meals: { $regex: new RegExp(`^${updateData.product_name}$`, "i") },
        _id: { $ne: toObjectId(productId.toString()) },
      })
      .lean();
    if (existingProduct) {
      throw new BadRequestError("This product name already exists");
    }
  }
  const cleanDateBeforeUpdate = removeUndefinedObject(updateData);
  const updateProduct = await productModel.findByIdAndUpdate(
    productId,
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
  console.log(`keySearch:::${keySearch}`);
  const regex = new RegExp(keySearch, "i");

  const results = await productModel
    .find({
      isPublished: true,
      isDelete: false,
      isDraft: false,
      product_name: { $regex: regex },
    })
    .limit(5)
    .lean();
  if (!results || results.length === 0) {
    throw new NotFoundError("Product not found");
  }
  return results;
};

const getProductById = async (product_id) => {
  return await productModel.findById(product_id);
};
module.exports = {
  getProductById,
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
  getProductsSortedBysales_count,
};
