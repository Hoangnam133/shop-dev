const inventoryModel = require('../models/inventoryModel')
const {BadRequestError} = require('../core/errorResponse')
const updateInventoryByProduct = async({productId, quantity})=>{
const update = await inventoryModel.findOneAndUpdate(
        { inven_productId: productId },
        { $inc: { inven_stock: -quantity } },
        { new: true }
    ).lean()
    if(!update){
        throw new BadRequestError('update inventory error')
    }
}
const getInventoryByProductId = async (product_id) => {
    const inventory = await inventoryModel.findOne({ inven_productId: product_id }).populate('inven_productId').lean()
    if (!inventory) throw new NotFoundError('Product not found in inventory')
    return inventory
}
const NumberOfProductInStock = async (product_id) => {
    
}
const getAllInventoriesWithStock = async () => {
  
        const inventories = await inventoryModel.find({ inven_stock: { $gt: 0 } }).populate('inven_productId').lean()
        if (!inventories) throw new NotFoundError('No inventory found')
        return inventories
   
}
const getAllOutOfStockInventories = async () => {
  
        const inventories = await inventoryModel.find({ inven_stock: { $eq: 0 } }).populate('inven_productId').lean()
        if (!inventories) throw new NotFoundError('No inventory found')
        return inventories
    
}
const updateInventoryStock = async ({product_id, newStock}) => {

        const updatedInventory = await inventoryModel.findOneAndUpdate(
            { inven_productId: product_id }, 
            { inven_stock: newStock },       
            { new: true, lean: true }      
        )
        if (!updatedInventory) throw new NotFoundError('update Inventory fail')
        return updatedInventory
}
const getProductminStockLevel = async () => {
    const lowerStock = await inventoryModel.find({
        $expr:{
            $lte: [ "$inven_stock", "$minStockLevel"]
        }
    }).populate('inven_productId').lean()
    if (!lowerStock || lowerStock.length === 0) throw new NotFoundError('No inventory found')
    return lowerStock
}
module.exports = {
    updateInventoryByProduct,
    getInventoryByProductId,
    getAllInventoriesWithStock,
    getAllOutOfStockInventories,
    updateInventoryStock,
    getProductminStockLevel,
}