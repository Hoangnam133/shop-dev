const { createSideDishModel,
    findSideDishById,
    updateSideDishById,
    softDeleteSideDishById,
    listSideDishes,
    listDeletedSideDishes,
    restoreDeletedSideDishById,
    findProductsBySideDishId} = require('../repositories/SideDishRepository')
    
class SideDishService {
    static async createSideDish(payload) {
        return await createSideDishModel(payload)
    }
    
    static async getSideDishById(sideDish_id) {
        return await findSideDishById(sideDish_id)
    }
    
    static async updateSideDish({sideDish_id, payload}) {
        return await updateSideDishById({sideDish_id, payload})
    }
    
    static async deleteSideDish(sideDish_id) {
        return await softDeleteSideDishById(sideDish_id)
    }
    
    static async getAllSideDishes({limit = 10, page = 1}) {
        return await listSideDishes({limit, page})
    }
    
    static async getAllDeletedSideDishes({limit = 10, page = 1}) {
        return await listDeletedSideDishes({limit, page})
    }
    
    static async restoreDeletedSideDish(sideDish_id) {
        return await restoreDeletedSideDishById(sideDish_id)
    }
    
    static async getProductsBySideDish({sideDish_id, limit = 10, page = 1}) {
        return await findProductsBySideDishId({sideDish_id, limit, page})
    }
}
module.exports = SideDishService