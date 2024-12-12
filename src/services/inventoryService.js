const {
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
  getListProductsInStockOfShop,
} = require("../repositories/inventoryRepository");
class InventoryService {
  static async getListProductsInStockOfShop({ shop_id, limit = 10, page = 1 }) {
    return await getListProductsInStockOfShop({ shop_id, limit, page });
  }
  static async getProductStockInAllShops({ product_id, limit = 10, page = 1 }) {
    return await getProductStockInAllShops({ product_id, limit, page });
  }
  static async getLowStockProductsInShop({ shop_id, limit = 10, page = 1 }) {
    return await getLowStockProductsInShop({ shop_id, limit, page });
  }
  static async getProductStockInShop({
    shop_id,
    product_id,
    limit = 10,
    page = 1,
  }) {
    return await getProductStockInShop({ shop_id, product_id, limit, page });
  }
  static async addProductToInventory({
    product_id,
    shop_id,
    inven_stock,
    minStockLevel,
  }) {
    console.log("product_id:", product_id);
    console.log("shop_id:", shop_id);
    console.log("quantity (inven_stock):", inven_stock);
    console.log("minStockLevel:", minStockLevel);
    return await addProductToInventory({
      product_id,
      shop_id,
      inven_stock,
      minStockLevel, // Truyền minStockLevel vào đây
    });
  }

  static async reduceInventoryStock({ product_id, shop_id, quantity }) {
    return await reduceInventoryStock({ product_id, shop_id, quantity });
  }
  static async checkInventoryStock({ product_id, shop_id, quantity }) {
    return await checkInventoryStock({ product_id, shop_id, quantity });
  }
  static async updateInventory({
    shop_id,
    product_id,
    inven_stock,
    minStockLevel,
  }) {
    return await updateInventory({
      shop_id,
      product_id,
      inven_stock,
      minStockLevel,
    });
  }
  static async checkProductOutOfStockAllShops({ product_id, limit, page }) {
    return await checkProductOutOfStockAllShops({ product_id, limit, page });
  }

  static async getLowStockProductsAcrossAllShops({ limit = 10, page = 1 }) {
    return await getLowStockProductsAcrossAllShops({ limit, page });
  }
  static async restoreProductInInventory({ product_id, shop_id }) {
    return await restoreProductInInventory({ product_id, shop_id });
  }
  static async getDeletedProductsInInventory({
    shop_id,
    limit = 10,
    page = 1,
  }) {
    return await getDeletedProductsInInventory({ shop_id, limit, page });
  }
  static async softDeleteProductInInventory({ shop_id, product_id }) {
    return await softDeleteProductInInventory({ shop_id, product_id });
  }
}
module.exports = InventoryService;
