const discountModel = require('../models/discountModel')
const {removeUndefinedObject, toObjectId} = require('../utils/index')
const { NotFoundError, BadRequestError } = require('../core/errorResponse')
const createDiscount = async (discountData) => {
    const discount = await discountModel.create(discountData)
    return discount
}
const getDiscountById = async (discountId) => {
    const discount = await discountModel.findById(discountId).lean()
    if (!discount) {
        throw new NotFoundError('Discount not found')
    }
    return discount
}
const getDiscountByCode = async (discountCode) => {
    const discount = await discountModel.findOne({ discount_code: discountCode }).lean()
    if (!discount) {
        throw new NotFoundError('Discount not found')
    }
    return discount
}
const getAllDiscounts = async ({ page , limit , filter = {} }) => {
    const discounts = await discountModel.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    return discounts
}
const updateDiscountById = async ({discount_id, dataUpdate}) => {
    const cleanedData = removeUndefinedObject(dataUpdate)
    const discount = await discountModel.findById(discount_id).lean()
     if (!discount) {
         throw new NotFoundError('Discount not found')
     }
    if (cleanedData.discount_code) {
        const existingDiscount = await discountModel.findOne({
            discount_code: cleanedData.discount_code,
            _id: { $ne: toObjectId(discount_id.toString()) } 
         })
        if (existingDiscount) {
            throw new BadRequestError('Discount code already exists');
        }
    }
 
    if (cleanedData.discount_start_date && cleanedData.discount_end_date) {
        if (new Date(cleanedData.discount_start_date) >= new Date(cleanedData.discount_end_date)) {
            throw new BadRequestError('Start date must be before end date');
        }
    }
    const max_total_uses_old = discount.max_total_uses
    if(cleanedData.max_total_uses){
        if ( cleanedData.max_total_uses < max_total_uses_old) {
            throw new BadRequestError('User has exceeded the maximum usage limit for this discount');
        }
    }

    if (cleanedData.discount_value && cleanedData.discount_value < 0) {
        throw new BadRequestError('Discount value cannot be negative');
    }
    
    if (cleanedData.min_order_value && cleanedData.min_order_value < 0) {
        throw new BadRequestError('Minimum order value cannot be negative');
    }
    
    if (cleanedData.maximum_discount_value && cleanedData.maximum_discount_value < 0) {
        throw new BadRequestError('Maximum discount value cannot be negative');
    }
    const updatedDiscount = await discountModel.findByIdAndUpdate(discount_id, cleanedData, {
        new: true,
        lean: true
    })
     
    if (!updatedDiscount) {
        throw new BadRequestError('Update discount failed')
    }
 
    return updatedDiscount
}
const softDeleteDiscount = async (discountId) => {
    const deletedDiscount = await discountModel.findByIdAndUpdate(discountId, { is_delete: true }, { new: true, lean: true });
    if (!deletedDiscount) {
        throw new NotFoundError('Delete discount failed')
    }
    return deletedDiscount
}
const isDiscountExpired = async (discountCode) => {
    const discount = await getDiscountByCode(discountCode)
    const currentDate = new Date();
    return discount.discount_end_date < currentDate
}
const updateDiscountUsageByUser = async (discountId, userId) => {
    const discount = await discountModel.findOneAndUpdate(
        { _id: discountId, "discount_user_used.dbu_userId": userId },
        { $inc: { "discount_user_used.$.count_used": 1 } }, 
        { new: true, lean: true }
    )
    if (!discount) {
        await discountModel.findByIdAndUpdate(discountId, {
            $push: { discount_user_used: { dbu_userId: userId, count_used: 1 } }
        }, { new: true, lean: true })
    }

    return discount
}
const checkUserDiscountUsage = async (discountId, userId) => {
    const discount = await discountModel.findById(discountId).lean();
    if (!discount) {
        throw new NotFoundError('Discount not found')
    }

    const userUsage = discount.discount_user_used.find(user => user.dbu_userId.toString() === userId.toString());
    if (!userUsage) {
        return discount.max_uses_per_user;
    }

    const remainingUses = discount.max_uses_per_user - userUsage.count_used;
    return remainingUses > 0 ? remainingUses : 0
}
const getPublicDiscounts = async () => {
    const discounts = await discountModel.find({ is_public: true, is_delete: false }).lean()
    return discounts;
}
const checkDiscountApplicable = async ({discount, applicableTo}) => {
    const getDiscount = await getDiscountById(discount._id)
    if (!getDiscount) {
        throw new NotFoundError('Discount not found')
    }
    if (getDiscount.applicable_to !== applicableTo) {
        throw new BadRequestError('Discount not applicable for this type')
    }
    return getDiscount
}
const checkMinOrderValue = async ({discount, orderValue}) => {
    const getDiscount = await getDiscountById(discount._id)
    if (getDiscount.min_order_value && orderValue < getDiscount.min_order_value) {
        throw new BadRequestError(`Order value must be at least ${getDiscount.min_order_value}`)
    }

    return getDiscount
}
const getDiscountsSortedByExpiryDate = async () => {
    const discounts = await discountModel.find({ is_delete: false })
        .sort({ discount_end_date: 1 }) 
        .lean()
    if (!discounts || discounts.length === 0) {
        throw new NotFoundError('No discounts available')
    }
    return discounts
}


const getMaxUsesForUser  = async (discount) => {
    const getDiscount = await getDiscountById(discount._id)
    if (!getDiscount) {
        throw new NotFoundError('Discount not found')
    }
    const userUsage = getDiscount.max_uses_per_user
    return userUsage
}
const userUsageCount = async({user_id, discount})=>{
    const getDiscount = await getDiscountById(discount._id)
    if (!getDiscount) {
        throw new NotFoundError('Discount not found')
    }
    const userUsage = getDiscount.discount_user_used.find(user => user.dbu_userId.toString() === user_id.toString())
    if (!userUsage) {
        return 0
    }
    return userUsage.count_used
}
const checkproductAppliedDiscount = async ({discount, product})=>{
    const foundDiscount = await getDiscountById(discount._id)
    const foundProductInDiscountApplied = foundDiscount.applicable_products.find(prod => prod._id.toString() === product._id.toString());
    if(!foundProductInDiscountApplied){
        return false
    }
    return true
}
const calculateDiscountAmount  = ({discountValue, totalPrice, discountValueType, maxValueDiscount}) => {
    let totalDiscount = 0;
    if (discountValueType === 'fixed_amount') {
        totalDiscount = discountValue 

    } else if (discountValueType === 'percentage') {
        totalDiscount = totalPrice * (discountValue / 100);
        if(totalDiscount > maxValueDiscount){
            totalDiscount = maxValueDiscount;
        }
    }
    return totalDiscount;
}
const calculateDiscount = async ({ product, checkDiscount, user, totalPrice }) => {
    let totalDiscount = 0;

    // Nếu không có mã giảm giá, không áp dụng giảm giá
    if (!checkDiscount) {
        return totalDiscount;
    }
    // Kiểm tra điều kiện giá trị đơn hàng tối thiểu
    const checkMinOrder = await checkMinOrderValue({ discount: checkDiscount, orderValue: totalPrice });
    if (!checkMinOrder) {
        throw new BadRequestError(`applied to order gt ${checkMinOrder}`)
    }

    // Kiểm tra số lần sử dụng còn lại của người dùng cho mã giảm giá này
    const usedCount = await userUsageCount({ user_id: user._id, discount: checkDiscount });
    const maxUses = await getMaxUsesForUser(checkDiscount);
    const remainingUses = maxUses - usedCount;

    // Nếu số lần sử dụng còn lại bằng 0 hoặc ít hơn, không áp dụng giảm giá
    if (remainingUses <= 0) {
        return totalDiscount;
    }

    // Kiểm tra mã giảm giá có áp dụng cho sản phẩm hay đơn hàng
    const applicableTo = checkDiscount.applicable_to;
    
    if (applicableTo === 'product') {
        // Kiểm tra mã giảm giá có áp dụng cho sản phẩm không
        const isProductApplicable = await checkproductAppliedDiscount({ discount: checkDiscount,product });
        if (isProductApplicable) {
            // Tính toán giảm giá nếu mã giảm giá áp dụng cho sản phẩm
            totalDiscount = calculateDiscountAmount({
                discountValue: checkDiscount.discount_value,
                totalPrice, // chỉ áp dụng giảm giá cho sản phẩm cụ thể
                discountValueType: checkDiscount.discount_value_type
            });
        }
    } else if (applicableTo === 'order') {
        // Tính toán giảm giá nếu mã giảm giá áp dụng cho toàn bộ đơn hàng
        totalDiscount = calculateDiscountAmount({
            discountValue: checkDiscount.discount_value,
            totalPrice, // áp dụng cho toàn bộ đơn hàng
            discountValueType: checkDiscount.discount_value_type,
            maxValueDiscount: checkDiscount.maximum_discount_value
        });
    }


    return totalDiscount;
};
const updateUserToDiscount = async ({ discountCode, user_id }) => {
    const discount = await discountModel.findOne({ discount_code: discountCode, is_delete: false }).lean()
    if (!discount) {
        throw new NotFoundError('Discount not found')
    }
    const userEntry = discount.discount_user_used.find(entry => entry.dbu_userId.toString() === user_id.toString())
    if (userEntry) {
        userEntry.count_used += 1
        discount.max_total_uses -= 1
        const updatedDiscount = await discountModel.findByIdAndUpdate(
            discount._id,
            {   discount_user_used: discount.discount_user_used,
                max_total_uses: discount.max_total_uses
            },
            { new: true, lean: true }
        )
        if (!updatedDiscount) {
            throw new BadRequestError('Update discount failed');
        }
    } else {
        discount.discount_user_used.push({ dbu_userId: user_id, count_used: 1 })
        discount.max_total_uses -= 1
        const updatedDiscount = await discountModel.findByIdAndUpdate(
            discount._id,
            { discount_user_used: discount.discount_user_used,
                max_total_uses: discount.max_total_uses
            },
            { new: true, lean: true }
        )
        if (!updatedDiscount) {
            throw new BadRequestError('Update discount failed')
        }
    }
    return discount
}
module.exports = {
    createDiscount,
    getDiscountById,
    getDiscountByCode,
    getAllDiscounts,
    updateDiscountById,
    softDeleteDiscount,
    isDiscountExpired,
    updateDiscountUsageByUser,
    checkUserDiscountUsage,
    getPublicDiscounts,
    checkDiscountApplicable,
    checkMinOrderValue,
    getDiscountsSortedByExpiryDate,
    getMaxUsesForUser,
    userUsageCount,
    calculateDiscount,
    updateUserToDiscount
}
