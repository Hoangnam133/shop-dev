const {
    createDiscount, getDiscountById, getDiscountByCode, getActiveDiscounts, updateDiscountById,
    softDeleteDiscount, isDiscountExpired, getPublicDiscounts, getValidDiscounts
} = require('../repositories/discountRepository')

class DiscountService{
    static async getValidDiscounts(user){
        return await getValidDiscounts(user)
    }
    static async createDiscount(payload, file){
        return await createDiscount(payload, file)
    }
    static async getDiscountById(discount_id){
        return await getDiscountById(discount_id)
    }
    static async getDiscountByCode(discountCode){
        return await getDiscountByCode(discountCode)
    }
    static async getActiveDiscounts({limit = 10, page = 1}){
        return await getActiveDiscounts({limit, page})
    }
    static async updateDiscountById({discount_id, dataUpdate}){
        return await updateDiscountById({discount_id, dataUpdate})
    }
    static async softDeleteDiscount(discount_id){
        return await softDeleteDiscount(discount_id)
    }
    static async isDiscountExpired(discountCode){
        return await isDiscountExpired(discountCode)
    }
    static async getPublicDiscounts({limit = 10, page = 1}){
        return await getPublicDiscounts({limit, page})
    }
}
module.exports = DiscountService