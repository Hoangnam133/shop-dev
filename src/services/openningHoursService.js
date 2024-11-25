const {  createOpeningHours,
    getAllOpeningHours,
    getOpeningHoursById,
    updateOpenningHours,
    softDeleteOpenningHours,
    getDeletedOpeningHours,
    getAllOpeningHoursOfShopId,
    restoreOpeningHours,
    getOpeningTimes
} = require('../repositories/openingHoursRepository')

class OpeningHoursService {
    static async getOpeningTimes(shop, daysToAdd) {
        return await getOpeningTimes(shop, daysToAdd)
    }
    static async createOpeningHours(payload) {
        return await createOpeningHours(payload)
    }
    static async getAllOpeningHours({limit, page}) {
        return await getAllOpeningHours({limit, page})
    }
    static async getOpeningHoursById(openingHours_id) {
        return await getOpeningHoursById(openingHours_id)
    }
    static async updateOpenningHours({openingHours_id, payload}) {
        return await updateOpenningHours({openingHours_id, payload})
    }
    static async softDeleteOpenningHours(openingHours_id) {
        return await softDeleteOpenningHours(openingHours_id)
    }
    static async getDeletedOpeningHours() {
        return await getDeletedOpeningHours()
    }
    static async getAllOpeningHoursOfShopId(shop_id) {
        return await getAllOpeningHoursOfShopId(shop_id)
    }
    static async restoreOpeningHours(openingHours_id){
        return await restoreOpeningHours(openingHours_id)  
    }
}
module.exports = OpeningHoursService