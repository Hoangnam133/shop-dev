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
const getInventoryByProductId = async (productId) => {
    const inventory = await inventoryModel.findOne({ inven_productId: productId }).populate('inven_productId').lean()
    if (!inventory) throw new NotFoundError('Product not found in inventory')
    return inventory
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
const updateInventoryStock = async (productId, newStock) => {

        const updatedInventory = await inventoryModel.findOneAndUpdate(
            { inven_productId: productId }, 
            { inven_stock: newStock },       
            { new: true, lean: true }      
        )
        if (!updatedInventory) throw new NotFoundError('update Inventory fail')
        return updatedInventory
}

module.exports = {
    updateInventoryByProduct
}