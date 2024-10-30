const {
    createDiscount, getDiscountById, getDiscountByCode, getAllDiscounts, updateDiscountById, softDeleteDiscount,
    isDiscountExpired, updateDiscountUsageByUser, checkUserDiscountUsage, getPublicDiscounts, checkDiscountApplicable,
    checkMinOrderValue, getDiscountsSortedByExpiryDate
} = require('../repositories/discountRepository')
const {initDataTimeFormat} = require('../utils/convertTime')
class DiscountService{
    static createDiscount = async (body) => {
        return await createDiscount(body)
    }
    static getDiscountById = async (discountId) => {
        return await getDiscountById(discountId)
    }

    static getDiscountByCode = async (discountCode) => {
        const discount =  await getDiscountByCode(discountCode)
        let message = ""
        if(discount.discount_end_date >= new Date(initDataTimeFormat())){
            message = "Discount is not yet expired."
        }
        else{
            message = "Discount has expired."
        }
        return {
            message,
            discount
        }
    }
    static getAllDiscounts = async ({page = 1, limit = 10}) => {
        const filter = {
            discount_end_date: { $gte: initDataTimeFormat() },
            is_public: true, 
            is_delete: false 
        }
        return await getAllDiscounts({ page, limit, filter })
    }
    static updateDiscount = async ({discount_id, dataUpdate}) => {
        return await updateDiscountById({discount_id, dataUpdate})
    }
    static getDiscountsSortedByExpiryDate = async () => {
        return await getDiscountsSortedByExpiryDate()
    }
    // danh sách còn hạn
    // danh sách hết hạn
    // danh sách đã công khai
    // danh sách chưa công khai
    // danh sách đã xóa
    // danh sách đã hết lượt sử dụng


    static softDeleteDiscount = async (discountId) => {
        return await softDeleteDiscount(discountId)
    }
    static isDiscountExpired = async (discountCode) => {
        return await isDiscountExpired(discountCode)
    }
    static updateDiscountUsageByUser = async (discountId, userId) => {
        return await updateDiscountUsageByUser(discountId, userId)
    }
    static checkUserDiscountUsage = async (discountId, userId) => {
        return await checkUserDiscountUsage(discountId, userId)
    }
    static getPublicDiscounts = async () => {
        return await getPublicDiscounts();
    }
    static checkDiscountApplicable = async (discountCode, applicableTo) => {
        return await checkDiscountApplicable(discountCode, applicableTo);
    }
    static checkMinOrderValue = async (discountCode, orderValue) => {
        return await checkMinOrderValue(discountCode, orderValue)
    }
    static getDiscountsSortedByExpiryDate = async () => {
        return await getDiscountsSortedByExpiryDate()
    }
}
module.exports = DiscountService