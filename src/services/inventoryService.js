const {getProductStockInAllShops,
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
    softDeleteProductInInventory
} = require('../repositories/inventoryRepository')
class InventoryService{
    static async getProductStockInAllShops({product_id, limit = 10, page = 1}){
        return await getProductStockInAllShops({product_id, limit , page })
    }
    static async getLowStockProductsInShop({shop_id, limit = 10, page = 1}){
        return await getLowStockProductsInShop({shop_id, limit, page})
    }
    static async getProductStockInShop({shop_id, product_id, limit = 10, page = 1}){
        return await getProductStockInShop({shop_id, product_id, limit, page})
    }
    static async addProductToInventory({product_id, shop_id, quantity}){
        return await addProductToInventory({product_id, shop_id, quantity})
    }
    static async reduceInventoryStock({product_id, shop_id, quantity}){
        return await reduceInventoryStock({product_id, shop_id, quantity})
    }
    static async checkInventoryStock({product_id, shop_id, quantity}){
        return await checkInventoryStock({product_id, shop_id, quantity})
    }
    static async updateInventory({ shop_id, product_id, quantity, minStockLevel }){
        return await updateInventory({ shop_id, product_id, quantity, minStockLevel })
    }
    static async checkProductOutOfStockAllShops(product_id){
        return await checkProductOutOfStockAllShops(product_id)
    }
    static async getLowStockProductsAcrossAllShops({limit = 10, page = 1}){
        return await getLowStockProductsAcrossAllShops({limit, page })
    }
    static async restoreProductInInventory({product_id, shop_id}){
        return await restoreProductInInventory({product_id, shop_id})
    }
    static async getDeletedProductsInInventory({shop_id, limit = 10, page = 1}){
        return await getDeletedProductsInInventory({shop_id, limit, page})
    }
    static async softDeleteProductInInventory({ shop_id, product_id }){
        return await softDeleteProductInInventory({shop_id, product_id})
    }
}
module.exports = InventoryService