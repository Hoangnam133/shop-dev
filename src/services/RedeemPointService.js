const {createRedeemPoints,
    getRedeemPointsUsed,
    getRedeemPointsNotUsed} = require('../repositories/redeemPointRepository')

class RedeemPointService {
    static async createRedeemPoints({user, product_id}){
        return await createRedeemPoints({user, product_id})
    }
    static async getRedeemPointsUsed({user, limit = 10, page = 1}){
        return await getRedeemPointsUsed({user, limit, page})
    }
    static async getRedeemPointsNotUsed({user, limit = 10, page = 1}){
        return await getRedeemPointsNotUsed({user, limit, page})
    }
}

module.exports = RedeemPointService