const inventoryModel = require("../models/inventoryModel");
const { BadRequestError } = require("../core/errorResponse");
const productModel = require("../models/productModel");
const { toObjectId } = require("../utils/index");
const shopModel = require("../models/shopModel");
const deductStockAfterPayment = async ({ shop_id, product_id, quantity }) => {
  const shop = await shopModel.findById(toObjectId(shop_id))
  if (!shop) {
      throw new BadRequestError('Shop not found')
  }
  const product = await productModel.findById(product_id)
  if (!product) {
      throw new BadRequestError('Product not found')
  }
  const query = {
    shop_id,
    product_id,
    isDeleted: false,
  },
  payload = {
    $inc:{
      inven_stock: -quantity,
    }
  },
  options = {
    new: true,
    upsert: true,
  };
  const updateInventory = await inventoryModel.findOneAndUpdate(query,payload,options)
  if (!updateInventory) {
    throw new BadRequestError("Failed to update inventory");
  }
  return true
}
const checkProductStockInShop = async ({ shop_id, product_id, quantity }) => {
  const shop = await shopModel.findById(toObjectId(shop_id))
  if (!shop) {
      throw new BadRequestError('Shop not found')
  }
  console.log('product idddddd',product_id)
  const product = await productModel.findById(product_id)
  if (!product) {
      throw new BadRequestError('Product not found')
  }
  const stockData = await inventoryModel.findOne({ shop_id, product_id, isDeleted: false })

  if (!stockData) {
      throw new BadRequestError('No inventory found for this product');
  }
  if(stockData.inven_stock <= 0 || stockData.inven_stock < quantity){
      return false
  }
  return true
}
// Hàm kiểm tra số lượng sản phẩm còn lại ở các chi nhánh
const getProductStockInAllShops = async ({
  product_id,
  limit = 10,
  page = 1,
}) => {
  const product = await productModel.findById(toObjectId(product_id.trim()));
  if (!product) {
    throw new BadRequestError("Product not found");
  }
  const skip = (page - 1) * limit;
  const stockData = await inventoryModel
    .find({ product_id, isDeleted: false })
    .populate("shop_id")
    .populate("product_id")
    .skip(skip)
    .limit(limit)
    .select("inven_stock shop_id product_id");

  if (!stockData || stockData.length === 0) {
    throw new BadRequestError("No inventory found for this product");
  }
  return stockData;
};

// Hàm kiểm tra các sản phẩm sắp hết hàng ở một chi nhánh cụ thể
const getLowStockProductsInShop = async ({ shop_id, limit = 10, page = 1 }) => {
  const shop = await shopModel.findById(toObjectId(shop_id.trim()));
  if (!shop) {
    throw new BadRequestError("Shop not found");
  }
  const skip = (page - 1) * limit;
  const lowStockProducts = await inventoryModel
    .find({
      shop_id,
      isDeleted: false, // Chỉ lấy sản phẩm chưa bị xóa
      $expr: { $lt: ["$inven_stock", "$minStockLevel"] },
    })
    .skip(skip)
    .limit(limit)
    .populate("product_id")
    .select("inven_stock minStockLevel product_id");

  if (!lowStockProducts || lowStockProducts.length === 0) {
    throw new BadRequestError(
      "There are no out of stock products in this branch"
    );
  }
  return lowStockProducts;
};
// Hàm kiểm tra số lượng sản phẩm còn lại trong kho của một chi nhánh cụ thể
const getProductStockInShop = async ({
  shop_id,
  product_id,
  limit = 10,
  page = 1,
}) => {
  const shop = await shopModel.findById(toObjectId(shop_id.trim()));
  if (!shop) {
    throw new BadRequestError("Shop not found");
  }
  const product = await productModel.findById(toObjectId(product_id.trim()));
  if (!product) {
    throw new BadRequestError("Product not found");
  }
  const skip = (page - 1) * limit;
  const stockData = await inventoryModel
    .findOne({ product_id, shop_id })
    .populate("shop_id")
    .populate("product_id")
    .skip(skip)
    .limit(limit)
    .select("inven_stock shop_id product_id")
    .lean();

  if (!stockData) {
    throw new BadRequestError(
      "No products in stock were found for this branch"
    );
  }
  return stockData;
};
// isDeleted
const softDeleteProductInInventory = async ({ shop_id, product_id }) => {
  const shop = await shopModel.findById(toObjectId(shop_id.trim()));
  if (!shop) {
    throw new BadRequestError("Shop not found");
  }
  const product = await productModel.findById(toObjectId(product_id.trim()));
  if (!product) {
    throw new BadRequestError("Product not found");
  }
  const updatedInventory = await inventoryModel.findOneAndUpdate(
    { shop_id, product_id, isDeleted: false }, // Chỉ xóa sản phẩm chưa bị xóa
    { isDeleted: true },
    { new: true, lean: true }
  );

  if (!updatedInventory) {
    throw new BadRequestError(
      "No products found in this branch warehouse to delete"
    );
  }

  return updatedInventory;
};
//Thêm sản phẩm mới vào kho của một chi nhánh
const addProductToInventory = async ({
  shop_id,
  product_id,
  inven_stock,
  minStockLevel,
}) => {
  const shop = await shopModel.findById(toObjectId(shop_id.trim()));
  if (!shop) {
    throw new BadRequestError("Shop not found");
  }
  const product = await productModel.findById(toObjectId(product_id.trim()));
  if (!product) {
    throw new BadRequestError("Product not found");
  }
  const existingInventory = await inventoryModel.findOne({
    shop_id,
    product_id,
  });
  if (existingInventory) {
    throw new BadRequestError(
      "The product already exists in this branch warehouse"
    );
  }
  if (inven_stock < 0) {
    throw new BadRequestError("Inventory quantity cannot be negative");
  }
  if (minStockLevel < 0) {
    throw new BadRequestError("The minimum inventory level cannot be negative");
  }
  if (inven_stock < minStockLevel) {
    throw new BadRequestError(
      "The inventory quantity must be greater than or equal to the minimum inventory level"
    );
  }
  const newInventory = await inventoryModel.create({
    shop_id,
    product_id,
    inven_stock,
    minStockLevel,
  });

  return newInventory;
};
//Giảm số lượng tồn kho khi có đơn hàng từ chi nhánh cụ thể
const reduceInventoryStock = async ({ shop_id, product_id, quantity }) => {
  const shop = await shopModel.findById(toObjectId(shop_id.trim()));
  if (!shop) {
    throw new BadRequestError("Shop not found");
  }
  const product = await productModel.findById(toObjectId(product_id.trim()));
  if (!product) {
    throw new BadRequestError("Product not found");
  }
  const updatedInventory = await inventoryModel.findOneAndUpdate(
    { shop_id, product_id, inven_stock: { $gte: quantity }, isDeleted: false },
    { $inc: { inven_stock: -quantity } },
    { new: true, lean: true }
  );

  if (!updatedInventory) {
    throw new BadRequestError("Insufficient inventory to process orders");
  }

  return updatedInventory;
};

//Kiểm tra tồn kho trước khi thực hiện đơn hàng
const checkInventoryStock = async ({ shop_id, product_id, quantity }) => {
  const shop = await shopModel.findById(toObjectId(shop_id.trim()));
  if (!shop) {
    throw new BadRequestError("Shop not found");
  }
  const product = await productModel.findById(toObjectId(product_id.trim()));
  if (!product) {
    throw new BadRequestError("Product not found");
  }
  const stockData = await inventoryModel.findOne({ shop_id, product_id });

  if (!stockData || stockData.inven_stock < quantity) {
    throw new BadRequestError("Insufficient inventory");
  }

  return stockData.inven_stock;
};
const updateInventory = async ({
  shop_id,
  product_id,
  quantity,
  minStockLevel,
}) => {
  const shop = await shopModel.findById(toObjectId(shop_id.trim()));
  if (!shop) {
    throw new BadRequestError("Shop not found");
  }
  const product = await productModel.findById(toObjectId(product_id.trim()));
  if (!product) {
    throw new BadRequestError("Product not found");
  }
  if (quantity < 0) {
    throw new BadRequestError("Inventory quantity cannot be negative");
  }
  if (minStockLevel < 0) {
    throw new BadRequestError("The minimum inventory level cannot be negative");
  }
  if (quantity < minStockLevel) {
    throw new BadRequestError(
      "The inventory quantity must be greater than or equal to the minimum inventory level"
    );
  }

  const updatedInventory = await inventoryModel.findOneAndUpdate(
    { shop_id, product_id },
    { inven_stock: quantity, minStockLevel },
    {
      new: true,
      lean: true,
    }
  );

  if (!updatedInventory) {
    throw new BadRequestError(
      "No products found in this branch warehouse for update"
    );
  }

  return updatedInventory;
};
//Kiểm tra sản phẩm hết hàng trên toàn hệ thống
const checkProductOutOfStockAllShops = async ({ product_id, limit, page }) => {
  const product = await productModel.findById(toObjectId(product_id.trim()));
  if (!product) {
    throw new BadRequestError("Product not found");
  }
  const skip = (page - 1) * limit;
  const outOfStockShops = await inventoryModel
    .find({ product_id, inven_stock: 0 })
    .populate("shop_id")
    .populate("product_id")
    .skip(skip)
    .limit(limit)
    .select("shop_id shop_name")
    .lean();

  if (outOfStockShops.length === 0) {
    throw new BadRequestError("The product is in stock at all branches");
  }

  return outOfStockShops;
};
// Kiểm tra mức tồn kho dưới ngưỡng trên toàn hệ thống
const getLowStockProductsAcrossAllShops = async ({ limit, page }) => {
  const skip = (page - 1) * limit;
  const lowStockProducts = await inventoryModel
    .find({
      $expr: { $lt: ["$inven_stock", "$minStockLevel"] },
    })
    .populate("shop_id")
    .populate("product_id")
    .skip(skip)
    .limit(limit)
    .select("inven_stock minStockLevel shop_id product_id")
    .lean();

  if (lowStockProducts.length === 0) {
    throw new BadRequestError("No products with low stock across branches");
  }

  return lowStockProducts;
};
//Hàm khôi phục sản phẩm
const restoreProductInInventory = async ({ shop_id, product_id }) => {
  const shop = await shopModel.findById(toObjectId(shop_id.trim()));
  if (!shop) {
    throw new BadRequestError("Shop not found");
  }
  const product = await productModel.findById(toObjectId(product_id.trim()));
  if (!product) {
    throw new BadRequestError("Product not found");
  }
  const updatedInventory = await inventoryModel.findOneAndUpdate(
    { shop_id, product_id, isDeleted: true },
    { isDeleted: false },
    { new: true, lean: true }
  );

  if (!updatedInventory) {
    throw new BadRequestError("No deleted products found to restore");
  }

  return updatedInventory;
};
//Hàm xem danh sách sản phẩm đã bị xóa
const getDeletedProductsInInventory = async ({
  shop_id,
  limit = 10,
  page = 1,
}) => {
  const shop = await shopModel.findById(toObjectId(shop_id.trim()));
  if (!shop) {
    throw new BadRequestError("Shop not found");
  }
  const skip = (page - 1) * limit;
  const deletedProducts = await inventoryModel
    .find({
      isDeleted: true,
      ...(shop_id && { shop_id }),
    })
    .populate("shop_id")
    .populate("product_id")
    .skip(skip)
    .limit(limit)
    .select("inven_stock shop_id product_id")
    .lean();
  if (!deletedProducts || deletedProducts.length === 0) {
    throw new BadRequestError("No deleted products found");
  }

  return deletedProducts;
};
const getListProductsInStockOfShop = async({shop_id, limit = 10,page = 1})=>{
  const skip = (page - 1) * limit;
  const products = await inventoryModel.find({shop_id})
  .populate({path: 'product_id'}).skip(skip).limit(limit).lean()
  if (!products || products.length === 0) {
    throw new BadRequestError('No products found in this shop');
  }
  return products;
}
module.exports = {
  getProductStockInAllShops,
  getLowStockProductsInShop,
  getProductStockInShop,
  addProductToInventory,
  reduceInventoryStock,
  checkInventoryStock,
  updateInventory,
  checkProductOutOfStockAllShops,
  getLowStockProductsAcrossAllShops,
  restoreProductInInventory,
  getDeletedProductsInInventory,
  softDeleteProductInInventory,
  checkProductStockInShop,
  deductStockAfterPayment,
  getListProductsInStockOfShop
};
