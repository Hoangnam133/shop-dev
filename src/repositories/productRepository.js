const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const { BadRequestError, NotFoundError } = require("../core/errorResponse");
const { removeUndefinedObject } = require("../utils/index");
const userModel = require("../models/userModel");
const shopModel = require("../models/shopModel");
const cartModel = require("../models/cartModel");
const slugify = require("slugify");
const { toObjectId } = require("../utils/index");
const shopProductModel = require("../models/shopProductModel");
const sideDishModel = require("../models/sideDishModel");
const fuzzy = require("fuzzy");
const uploadService = require("../services/uploadService");
const inventoryModel = require('../models/inventoryModel')
const Fuse = require('fuse.js');
const favoritesModel = require('../models/favoriteModel');
// kiểm tra shop có tồn tại
const checkShop = async (shop_id) => {
  if (!shop_id) {
    throw new BadRequestError("Shop ID is required");
  }

  const foundShop = await shopModel.findById(shop_id);
  if (!foundShop) {
    throw new NotFoundError("Shop not found");
  }
  return foundShop;
};
// kiểm tra sản phẩm có tồn tại trong shop đó không
const checkProductInShop = async (shop_id, product_id) => {
  await checkShop(shop_id);
  const product = await productModel.findOne({
    _id: product_id,
    isDeleted: false,
    isPublished: true,
  });
  const checkProduct = await shopProductModel.findOne({
    shop_id,
    product_id,
  });
  if (!product || !checkProduct) {
    return false;
  }
  return true;
};
// tạo sản phẩm
const createProduct = async (payload, file) => {
  let { category_id, shop_ids } = payload;

  const findcategory = await categoryModel.findById(
    toObjectId(category_id.trim())
  );
  if (!findcategory) {
    throw new NotFoundError("Category not found");
  }

  if (!Array.isArray(shop_ids) || shop_ids.length === 0) {
    throw new BadRequestError("shop_ids cannot be empty");
  }

  const shopObjectIds = [];

  for (let i = 0; i < shop_ids.length; i++) {
    const id = shop_ids[i].trim();
    // const objectId = toObjectId(id.trim());
    shopObjectIds.push(id);
  }

  const getAllShop = await shopModel.find(
    { _id: { $in: shopObjectIds } },
    "_id"
  );
  if (getAllShop.length !== shop_ids.length) {
    throw new BadRequestError("One or more shop_ids are not valid");
  }
  if (!file) {
    throw new BadRequestError("Image file is required");
  }
  const uploadImg = await uploadService.uploadImageFromLocalS3(file);
  if (!uploadImg) {
    throw new BadRequestError("Failed to upload image");
  }
  payload.product_thumb = uploadImg;
  const newProduct = await productModel.create(payload);
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
// lấy ra sản phẩm mới nhất (limit)
const getLatestProducts = async ({ limit = 10, shop_id }) => {
  const products = await shopProductModel
    .find({
      isPublished: true,
      isDeleted: false,
      shop_id: toObjectId(shop_id.trim()),
    })
    .sort({ createdAt: -1 })
    .populate("product_id")
    .limit(limit);
  if (!products) {
    throw new NotFoundError(" not found products");
  }
};
// lấy ra sản phẩm bán chạy nhất (có sắp xếp giảm dần theo lượt bán)
const getProductsSortedBysales_count = async (shop_id) => {
  const checkShopId = await checkShop(shop_id);
  if (!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  const objShop_id = toObjectId(shop_id.trim());

  const products = await shopProductModel
    .find({ isPublished: true, isDeleted: false, shop_id: objShop_id })
    .populate("product_id")
    .sort({ sales_count: -1 });
  if (!products) {
    throw new NotFoundError(" not found products");
  }
  return products;
};
// lấy ra sản phẩm sắp xếp theo giá từ cao đến thấp hoặc ngược lại
const getProductsSortedByPrice = async ({
  sortOrder = "asc",
  page = 1,
  limit = 10,
  shop_id,
}) => {
  const checkShopId = await checkShop(shop_id);
  if (!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  const objShop_id = toObjectId(shop_id.trim());

  const shopProducts = await shopProductModel
    .find({ shop_id: objShop_id, isPublished: true, isDeleted: false })
    .populate("product_id")
    .sort({ product_price: sortOrder === "asc" ? 1 : -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  if (!shopProducts || shopProducts.length === 0) {
    throw new NotFoundError("No products found");
  }

  return shopProducts;
};
// lấy ra sản phẩm đánh giá từ thấp đến cao hoặc ngược lại
const getProductsSortedByRatingDesc = async ({
  sortOrder = "asc",
  page = 1,
  limit = 10,
  shop_id,
}) => {
  const checkShopId = await checkShop(shop_id);
  if (!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  const objShop_id = toObjectId(shop_id.trim());

  const shopProducts = await shopProductModel
    .find({ shop_id: objShop_id, isPublished: true, isDeleted: false })
    .populate("product_id")
    .sort({ product_ratingAverage: sortOrder === "asc" ? 1 : -1 })
    .limit(limit)
    .skip((page - 1) * limit);
  if (!shopProducts || shopProducts.length === 0) {
    throw new NotFoundError("No products found");
  }

  return shopProducts;
};
// lấy ra tất cả sản phẩm trong 1 shop
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
  if (!shopProducts || shopProducts.length === 0) {
    throw new NotFoundError("No products found");
  }
};
// lấy ra sản phẩm từ danh mục (ví dụ cà phê sẽ có bạc xỉu, cf sữa đá)
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

  category_id = toObjectId(category_id.trim());

  const existingCategory = await categoryModel.findById(category_id);
  if (!existingCategory) {
    throw new NotFoundError("Category not found");
  }

  const productIds = await productModel.find({ category_id }).distinct("_id");

  const availableProducts = await inventoryModel
    .find({
      shop_id: checkShopId._id,
      product_id: { $in: productIds },
      inven_stock: { $gt: 0 },
      isDeleted: false,
    })
    .populate("product_id");

  if (!availableProducts || availableProducts.length === 0) {
    throw new NotFoundError("No available products in this category");
  }

  const products = await shopProductModel
    .find({
      shop_id: checkShopId._id,
      isPublished: true,
      isDeleted: false,
      product_id: { $in: availableProducts.map((item) => item.product_id._id) },
    })
    .populate("product_id")
    .limit(limit)
    .skip(skip);

  if (!products || products.length === 0) {
    throw new NotFoundError("No products found in this category");
  }

  return {
    category_name: existingCategory.category_name,
    products,
  };
};

//Admin only (lấy ra danh sách tất cả sản phẩm đã published )
const getPublishedProducts = async ({ limit, page }) => {
  const skip = (page - 1) * limit;
  const products = await productModel
    .find({ isPublished: true, isDeleted: false })
    .skip(skip)
    .limit(limit)
    .lean();
  if (!products) {
    throw new NotFoundError(" not found products");
  }
  return products;
};
// manage branch (lấy ra danh sách tất cả sản phẩm đã published ở 1 shop cụ thể )
const getPublishedProductsManage = async ({
  limit = 10,
  page = 1,
  shop_id,
}) => {
  const checkShopId = await checkShop(shop_id);
  if (!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
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
//Admin only (lấy ra danh sách tất cả sản phẩm đã bị xóa)
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
// manage branch (lấy ra danh sách sản phẩm đã bị xóa ở 1 shop cụ thể)
const getDeletedProductsManage = async ({ limit = 10, page = 1, shop_id }) => {
  const skip = (page - 1) * limit;
  const checkShopId = await checkShop(shop_id);
  if (!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
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
const updateProduct = async ({ user, product_id, updateData, file }) => {
  if (!user) {
    throw new BadRequestError("User not found");
  }

  const foundProduct = await productModel.findById(product_id);
  if (!foundProduct) {
    throw new NotFoundError("Product not found");
  }

  const findUser = await userModel.findById(user._id);
  if (!findUser) throw new NotFoundError("User not found");

  // Kiểm tra nếu có thay đổi tên sản phẩm
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
    updateData.product_slug = slugify(updateData.product_name, { lower: true });
  }

  // Cập nhật required_points nếu giá thay đổi
  if (updateData.product_price) {
    updateData.required_points = Math.floor(updateData.product_price * 0.1);
  }

  // Loại bỏ các thuộc tính undefined trước khi cập nhật
  const cleanDataBeforeUpdate = removeUndefinedObject(updateData);
  if (file) {
    const uploadImg = await uploadService.uploadImageFromLocalS3(file);
    if (!uploadImg) {
      throw new BadRequestError("Failed to upload image");
    }
    cleanDataBeforeUpdate.product_thumb = uploadImg;
  }
  let updateProduct;

  // Kiểm tra và thêm sideDish_id nếu có
  if (cleanDataBeforeUpdate.sideDish_id) {
    const sideDish = cleanDataBeforeUpdate.sideDish_id;

    // Check if the sideDish already exists in the product's sideDish_id array
    const isSideDishExist = foundProduct.sideDish_id.some(
      (id) => id.toString() === sideDish.toString()
    );

    if (isSideDishExist) {
      throw new BadRequestError("This side dish is already in the product");
    } else {
      // Remove sideDish_id from updateData and push it to the array
      delete cleanDataBeforeUpdate.sideDish_id;
      updateProduct = await productModel.findByIdAndUpdate(
        product_id,
        {
          $set: cleanDataBeforeUpdate,
          $push: { sideDish_id: sideDish }, // Add the sideDish to the array
        },
        {
          new: true,
          lean: true,
        }
      );
    }
  }

  // If no sideDish_id provided, just update the product
  if (!cleanDataBeforeUpdate.sideDish_id) {
    updateProduct = await productModel.findByIdAndUpdate(
      product_id,
      { $set: cleanDataBeforeUpdate },
      { new: true, lean: true }
    );
  }

  if (!updateProduct) {
    throw new NotFoundError("Product not found");
  }

  console.log("Update Product ID:", updateProduct._id);

  // Xử lý khi sản phẩm bị xóa hoặc không được xuất bản
  if (updateProduct.isDeleted || !updateProduct.isPublished) {
    await processProductUnPublishOrDeleteFromAdmin(updateProduct._id);
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
          "cart_products.$.isDeleted": true,
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
        isDeleted: true,
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
const removeVietnameseTones = (str) => {
  return str
    .normalize("NFD") // Chuyển ký tự về dạng tổ hợp
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};
const searchProductByUser = async (keySearch) => {
  try {
    if (!keyword) {
      throw new BadRequestError("Search keyword is required");
    }
    const normalizedKeyword = removeVietnameseTones(keyword.toLowerCase());
    const products = await productModel.find(
      { isPublished: true, isDeleted: false },
      "product_name product_description product_thumb _id product_price"
    );

    const fuseData = products.map((product) => ({
      ...product.toObject(),
      normalized_name: removeVietnameseTones(
        product.product_name.toLowerCase()
      ),
      normalized_description: removeVietnameseTones(
        product.product_description.toLowerCase()
      ),
    }));

    const options = {
      keys: ["normalized_name", "normalized_description"],
      threshold: 0.2, // Mức độ mờ của tìm kiếm
    };

    const fuse = new Fuse(fuseData, options);
    const results = fuse.search(normalizedKeyword);
    const matchedProducts = results.map((result) => result.item);

    const formattedProducts = matchedProducts.slice(0, 10).map((product) => ({
      product_id: {
      _id: product._id,
      product_name: product.product_name,
      product_description: product.product_description,
      product_thumb: product.product_thumb,
      product_price: product.product_price,
      }
    }));

    return {
      products: formattedProducts,
    };
  } catch (error) {
    console.error("Error in searchProducts:", error);
    throw error;
  }
};

const getProductById = async (product_id, user) => {
  let favorites_status = false
  const foundProduct = await productModel.findById(product_id).populate({
    path: "sideDish_id",
    select: "sideDish_name price",
  })
  if (!foundProduct) {
    throw new NotFoundError("Product not found");
  }
  const favorite = await favoritesModel.findOne({
    product_id: foundProduct._id,
    user_id: user._id,
  })
  if (favorite) {
    favorites_status = true
  }
  return {
    product_details:{
      product: foundProduct,
      favorites_status
    }
  };
};
const getProductByIdOfShop = async (product_id) => {};
//----------------------------------------------------------------
const getSideDishInProduct = async (product_id) => {
  const foundProduct = await productModel.findById(product_id);
  if (!foundProduct) {
    throw new NotFoundError("Product not found");
  }
  const sideDishes = await sideDishModel.find({
    _id: { $in: foundProduct.sideDish_id },
  });
  return sideDishes;
};
module.exports = {
  getProductById,
  createProduct,
  updateProduct,
  updateDeleteProduct,
  updatePublishProduct,
  getAllProductsByShopId,
  getProductsSortedByRatingDesc,
  getPublishedProducts,
  getDeletedProducts,
  getProductsByCategory,
  searchProductByUser,
  getProductsSortedByPrice,
  getLatestProducts,
  getProductsSortedBysales_count,
  getPublishedProductsManage,
  getDeletedProductsManage,
  checkShop,
  checkProductInShop,
  getSideDishInProduct,
};
