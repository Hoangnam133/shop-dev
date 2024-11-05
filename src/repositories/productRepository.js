const productModel = require("../models/productModel");
const categoryModel = require("../models/categoryModel");
const { BadRequestError, NotFoundError } = require("../core/errorResponse");
const { removeUndefinedObject } = require("../utils/index");
const userModel = require("../models/userModel");
const shopModel = require("../models/shopModel");
const cartModel = require("../models/cartModel");
const inventoryModel = require("../models/inventoryModel");
const { toObjectId } = require("../utils/index");
const { forEach } = require("lodash");
const shopProductModel = require('../models/shopProductModel')
// kiểm tra shop có tồn tại
const checkShop = async(shop_id)=>{
  if(!shop_id) {
    throw new BadRequestError("Shop ID is required");
  }
  const objShop_id = toObjectId(shop_id.trim())
  const foundShop = await shopModel.findById(objShop_id)
  if(!foundShop) {
    throw new NotFoundError("Shop not found");
  }
  return foundShop
}
// kiểm tra sản phẩm có tồn tại trong shop đó không
const checkProductInShop = async({shop_id, product_id}) => {
  const shop = await checkShop(shop_id)
  const product = await productModel.findOne({
    _id: toObjectId(product_id),
    isDelete: false,
    isPublished: true
  })
  const checkProduct = await shopProductModel.findOne({
    shop_id: shop._id,
    product_id: product._id,
  })
  if(!shop && !product && !checkProduct){
    return false
  }
  return true
}
// tạo sản phẩm
const createProduct = async (payload) => {
  const { category_id, shop_ids } = payload;

  const findcategory = await categoryModel.findById(toObjectId(category_id.trim()));
  if (!findcategory) {
    throw new NotFoundError("Category not found");
  }
  
  if (!Array.isArray(shop_ids) || shop_ids.length === 0) {
    throw new BadRequestError("shop_ids cannot be empty");
  }

  const shopObjectIds = [];
 
  for (let i = 0; i < shop_ids.length; i++) {
    const id = shop_ids[i].trim(); 
    const objectId = toObjectId(id.trim()); 
    shopObjectIds.push(objectId); 
  }
  
  const getAllShop = await shopModel.find({ _id: { $in: shopObjectIds } }, "_id");
  if (getAllShop.length !== shop_ids.length) {
    throw new BadRequestError("One or more shop_ids are not valid");
  }
  
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
const getLatestProducts = async ({limit = 10, shop_id}) => {
  const products = await shopProductModel
    .find({ isPublished: true , isDeleted: false, shop_id: toObjectId(shop_id.trim())})
    .sort({ createdAt: -1 })
    .populate('product_id') 
    .limit(limit);
  if (!products) {
    throw new NotFoundError(" not found products")
  }
}
// lấy ra sản phẩm bán chạy nhất (có sắp xếp giảm dần theo lượt bán)
const getProductsSortedBysales_count = async (shop_id) => {
  const checkShopId = await checkShop(shop_id)
  if(!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  const objShop_id = toObjectId(shop_id.trim())
  
  const products = await shopProductModel
  .find({ isPublished: true , isDeleted: false, shop_id: objShop_id })
  .populate('product_id') 
  .sort({ sales_count: -1 });
  if (!products) {
    throw new NotFoundError(" not found products");
  }
  return products;
}
// lấy ra sản phẩm sắp xếp theo giá từ cao đến thấp hoặc ngược lại
const getProductsSortedByPrice = async ({
  sortOrder = "asc",
  page = 1,
  limit = 10,
  shop_id,
}) => {
  const checkShopId = await checkShop(shop_id)
  if(!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  const objShop_id = toObjectId(shop_id.trim())
  
  const shopProducts = await shopProductModel
    .find({ shop_id: objShop_id, isPublished: true, isDeleted: false }) 
    .populate('product_id') 
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
  const checkShopId = await checkShop(shop_id)
  if(!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  const objShop_id = toObjectId(shop_id.trim())
  
  const shopProducts = await shopProductModel
    .find({ shop_id: objShop_id, isPublished: true, isDeleted: false }) 
    .populate('product_id') 
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
  const checkShopId = await checkShop(shop_id)
  if(!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  const objShop_id = toObjectId(shop_id.trim())
  const foundShop = await shopModel.findById(objShop_id)
  const shopProducts = await shopProductModel
    .find({ shop_id: objShop_id, isPublished: true, isDeleted: false }) 
    .populate('product_id') 
    .limit(limit) 
    .skip(skip); 
  if (!shopProducts || shopProducts.length === 0) {
    throw new NotFoundError("No products found");
  }
}
// lấy ra sản phẩm từ danh mục (ví dụ cà phê sẽ có bạc xỉu, cf sữa đá)
const getProductsByCategory = async ({ category_id, limit = 10, page = 1, shop_id }) => {
  const skip = (page - 1) * limit;
  if(!category_id){
    throw new BadRequestError("Category ID is required");
  }
  const checkShopId = await checkShop(shop_id)
  if(!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  const category_id = toObjectId(category_id.trim());
  const existingCategory = await cartModel.findById(category_id)
  if (!existingCategory) {
    throw new NotFoundError("Category not found");
  }
  const productIds = await productModel.find({ category_id}).distinct('_id');
  const products = await shopProductModel
    .find({
      shop_id: checkShopId._id,
      isPublished: true,
      isDeleted: false,
      product_id: { $in: productIds } 
    })
    .populate('product_id') 
    .limit(limit) 
    .skip(skip);
  if (!products || products.length === 0) {
    throw new NotFoundError("No products found in this category");
  }

  return products
}
//Admin only (lấy ra danh sách tất cả sản phẩm đã published )
const getPublishedProducts = async ({ limit, page }) => {
  const skip = (page - 1) * limit;
  const products = await productModel
    .find({ isPublished: true, isDeleted: false})
    .skip(skip)
    .limit(limit)
    .lean();
  if (!products) {
    throw new NotFoundError(" not found products");
  }
  return products;
}
// manage branch (lấy ra danh sách tất cả sản phẩm đã published ở 1 shop cụ thể )
const getPublishedProductsManage = async ({ limit = 10, page = 1, shop_id }) => {
  const checkShopId = await checkShop(shop_id)
  if(!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  const skip = (page - 1) * limit;
  const products = await shopProductModel
    .find({ isPublished: true, isDeleted: false, shop_id: checkShopId._id})
    .populate('product_id') 
    .skip(skip)
    .limit(limit)
    .lean()
  if (!products) {
    throw new NotFoundError(" not found products")
  }
  return products
}
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
}
// manage branch (lấy ra danh sách sản phẩm đã bị xóa ở 1 shop cụ thể)
const getDeletedProductsManage = async ({ limit = 10, page = 1, shop_id }) => {
  const skip = (page - 1) * limit;
  const checkShopId = await checkShop(shop_id)
  if(!checkShopId) {
    throw new NotFoundError("Shop not found");
  }
  const products = await shopProductModel
    .find({ isPublished: true , isDeleted: false, shop_id: checkShopId._id})
    .populate('product_id') 
    .skip(skip)
    .limit(limit)
    .lean()
  if (!products) {
    throw new NotFoundError(" not found products")
  }
  return products
}

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
}
const getProductById = async (product_id) => {
  const foundProduct = await productModel.findById(toObjectId(product_id));
  if (!foundProduct) {
    throw new NotFoundError("Product not found");
  }
  return foundProduct;
}
const getProductByIdOfShop = async (product_id) => {

}
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
  checkProductInShop
}
