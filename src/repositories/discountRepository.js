const discountModel = require("../models/discountModel");
const { removeUndefinedObject, toObjectId } = require("../utils/index");
const { NotFoundError, BadRequestError } = require("../core/errorResponse");
const { getCurrentDateInTimeZone } = require("../utils/convertTime");
const uploadService = require("../services/uploadService");
const moment = require('moment');
// tạo mã giảm giá
const createDiscount = async (payload, file) => {
  const existingDiscount = await discountModel.findOne({
    discount_code: payload.discount_code,
  });
  if (existingDiscount) {
    throw new BadRequestError("Discount code already exists");
  }
  if (
    new Date(payload.discount_start_date) >= new Date(payload.discount_end_date)
  ) {
    throw new BadRequestError(
      "The start date must be earlier than the end date"
    );
  }
  if (!file) {
    throw new BadRequestError('Image file is required');
  }
  const uploadImg = await uploadService.uploadImageFromLocalS3(file)
  if (!uploadImg) {
    throw new BadRequestError("Failed to upload image");
  }
  payload.discount_image = uploadImg;
  const discount = await discountModel.create(payload);
  if (!discount) {
    throw new BadRequestError("Failed to create discount");
  }
  return discount;
};
// lấy discount theo id
const getDiscountById = async (discount_id) => {
  const discount = await discountModel.findById(toObjectId(discount_id)).lean();
  return discount;
};
// lấy discount theo mã code
const getDiscountByCode = async (discountCode) => {
  const discount = await discountModel
    .findOne({ discount_code: discountCode })
    .lean();
  return discount;
};
// danh sách mã giảm giá còn hiệu lực
const getActiveDiscounts = async ({ page, limit }) => {
  const filter = {
    discount_end_date: { $gte: getCurrentDateInTimeZone() },
    is_deleted: false,
  };
  const discounts = await discountModel.find(filter)


  return discounts;
};
// cập nhật discount
const updateDiscountById = async ({ discount_id, dataUpdate }) => {
  const cleanedData = removeUndefinedObject(dataUpdate);
  const discount = await discountModel.findById(discount_id).lean();
  if (!discount) {
    throw new NotFoundError("Discount not found");
  }
  if (cleanedData.discount_code) {
    const existingDiscount = await discountModel.findOne({
      discount_code: cleanedData.discount_code,
      _id: { $ne: toObjectId(discount_id.toString()) },
    });
    if (existingDiscount) {
      throw new BadRequestError("Discount code already exists");
    }
  }

  if (cleanedData.discount_start_date && cleanedData.discount_end_date) {
    if (
      new Date(cleanedData.discount_start_date) >=
      new Date(cleanedData.discount_end_date)
    ) {
      throw new BadRequestError("Start date must be before end date");
    }
  }
  const max_total_uses_old = discount.max_total_uses;
  if (cleanedData.max_total_uses) {
    if (cleanedData.max_total_uses < max_total_uses_old) {
      throw new BadRequestError(
        "User has exceeded the maximum usage limit for this discount"
      );
    }
  }

  if (cleanedData.discount_value && cleanedData.discount_value < 0) {
    throw new BadRequestError("Discount value cannot be negative");
  }

  if (cleanedData.min_order_value && cleanedData.min_order_value < 0) {
    throw new BadRequestError("Minimum order value cannot be negative");
  }

  if (
    cleanedData.maximum_discount_value &&
    cleanedData.maximum_discount_value < 0
  ) {
    throw new BadRequestError("Maximum discount value cannot be negative");
  }
  const updatedDiscount = await discountModel.findByIdAndUpdate(
    discount._id,
    cleanedData,
    {
      new: true,
      lean: true,
    }
  );

  if (!updatedDiscount) {
    throw new BadRequestError("Update discount failed");
  }
  return updatedDiscount;
};
// xóa mềm discount
const softDeleteDiscount = async (discount_id) => {
  const deletedDiscount = await discountModel.findByIdAndUpdate(
    toObjectId(discount_id),
    { is_deleted: true },
    { new: true, lean: true }
  );
  if (!deletedDiscount) {
    throw new NotFoundError("Delete discount failed");
  }
  return deletedDiscount;
};
// kiểm tra mã giảm giá đã hết hạn hay chưa (nếu trả về true là mã đó hết hạn)
const isDiscountExpired = async (discountCode) => {
  const discount = await getDiscountByCode(discountCode);
  const currentDate = new Date();
  return discount.discount_end_date < currentDate;
};
// cập nhật khi user sử dụng mã giảm giá
const updateDiscountUsageByUser = async (discountId, userId) => {
  const discount = await discountModel.findOneAndUpdate(
    { _id: discountId, "discount_user_used.dbu_userId": userId },
    { $inc: { "discount_user_used.$.count_used": 1 } },
    { new: true, lean: true }
  );
  if (!discount) {
    await discountModel.findByIdAndUpdate(
      discountId,
      {
        $push: { discount_user_used: { dbu_userId: userId, count_used: 1 } },
      },
      { new: true, lean: true }
    );
  }

  return discount;
};
// kiểm tra số lượt sử dụng mã giảm giá của user cụ thể
const checkUserDiscountUsage = async (discount_id, user) => {
  const discount = await discountModel.findById(toObjectId(discount_id)).lean();
  if (!discount) {
    throw new NotFoundError("Discount not found");
  }
  const userUsage = discount.discount_user_used.find(
    (user) => user.dbu_userId.toString() === user._id.toString()
  );
  if (!userUsage) {
    return discount.max_uses_per_user;
  }
  const remainingUses = discount.max_uses_per_user - userUsage.count_used;
  return remainingUses > 0 ? remainingUses : 0;
};
// lấy tất cả mã giảm giá chưa bị xóa
const getPublicDiscounts = async ({ limit, page }) => {
  const skip = (page - 1) * limit;
  const discounts = await discountModel
    .find({ is_deleted: false })
    .skip(skip)
    .limit(limit)
    .lean();
  return discounts;
};
// hàm này kiểm tra xem giảm giá này áp dụng có đúng loại (order / product ) không (xem chi tiết ở models)
const checkDiscountApplicable = async (discount, applicableTo ) => {
  // truyền vô discount luôn
  const getDiscount = await getDiscountById(discount._id);
  if (getDiscount.applicable_to !== applicableTo) {
    throw new BadRequestError("Discount not applicable for this type");
  }
  return getDiscount;
};
// kiểm tra giá trị order của user xem có phù hợp để sử dụng mã giảm giá này không
const checkMinOrderValue = async ({ discount, orderValue }) => {
  const getDiscount = await getDiscountById(discount._id);
  if (getDiscount.min_order_value && orderValue < getDiscount.min_order_value) {
    throw new BadRequestError(
      `Order value must be at least ${getDiscount.min_order_value}`
    );
  }
  return getDiscount;
};
// lấy các discount chưa bị xóa và sắp xếp (ngày nào sắp hết hạn sẽ được ưu tiên lên trên)
const getDiscountsSortedByExpiryDate = async () => {
  const discounts = await discountModel
    .find({ is_delete: false })
    .sort({ discount_end_date: 1 })
    .lean();
  if (!discounts || discounts.length === 0) {
    throw new NotFoundError("No discounts available");
  }
  return discounts;
};
// lấy ra số lượt sử dụng tối đa của 1 user của 1 discount
const getMaxUsesForUser = async (discount) => {
  const getDiscount = await getDiscountById(discount._id);
  if (!getDiscount) {
    throw new NotFoundError("Discount not found");
  }
  const userUsage = getDiscount.max_uses_per_user;
  return userUsage;
};

// lấy ra số lượt đã sử dụng của 1 user của 1 discount
const userUsageCount = async ({ user, discount }) => {
  const getDiscount = await getDiscountById(discount._id);
  if (!getDiscount) {
    throw new NotFoundError("Discount not found");
  }
  const userUsage = getDiscount.discount_user_used.find(
    (user) => user.dbu_userId.toString() === user._id.toString()
  );
  if (!userUsage) {
    return 0;
  }
  return userUsage.count_used;
};
// kiểm tra xem sản phẩm có  được áp dụng mã giảm giá này hay không (return true/false)
const checkproductAppliedDiscount = async (discount, product) => {
  const foundDiscount = await getDiscountById(discount._id);
  const foundProductInDiscountApplied = foundDiscount.applicable_products.find(
    (prod) => prod._id.toString() === product._id.toString()
  );
  if (!foundProductInDiscountApplied) {
    return false;
  }
  return true;
};
// tính toán giảm giá dựa trên từng loại cụ thể (tổng tiền hoặc phần trăm)
const calculateDiscountAmount = ({
  discountValue,
  totalPrice,
  discountValueType,
  maxValueDiscount,
}) => {
  let totalDiscount = 0;
  if (discountValueType === "fixed_amount") {
    totalDiscount = discountValue;
  } else if (discountValueType === "percentage") {
    totalDiscount = totalPrice * (discountValue / 100);
    if (totalDiscount > maxValueDiscount) {
      totalDiscount = maxValueDiscount;
    }
  }
  return totalDiscount;
};
const calculateDiscount = async ({
  product,
  checkDiscount,
  user,
  totalPrice,
}) => {
  let totalDiscount = 0;

  // Nếu không có mã giảm giá, không áp dụng giảm giá
  if (!checkDiscount) {
    return totalDiscount;
  }
  // Kiểm tra điều kiện giá trị đơn hàng tối thiểu
  const checkMinOrder = await checkMinOrderValue({
    discount: checkDiscount,
    orderValue: totalPrice,
  });
  if (!checkMinOrder) {
    throw new BadRequestError(`applied to order gt ${checkMinOrder}`);
  }

  // Kiểm tra số lần sử dụng còn lại của người dùng cho mã giảm giá này
  const usedCount = await userUsageCount({
    user_id: user._id,
    discount: checkDiscount,
  });
  const maxUses = await getMaxUsesForUser(checkDiscount);
  const remainingUses = maxUses - usedCount;

  // Nếu số lần sử dụng còn lại bằng 0 hoặc ít hơn, không áp dụng giảm giá
  if (remainingUses <= 0) {
    return totalDiscount;
  }

  // Kiểm tra mã giảm giá có áp dụng cho sản phẩm hay đơn hàng
  const applicableTo = checkDiscount.applicable_to;

  if (applicableTo === "product") {
    // Kiểm tra mã giảm giá có áp dụng cho sản phẩm không
    const isProductApplicable = await checkproductAppliedDiscount({
      discount: checkDiscount,
      product,
    });
    if (isProductApplicable) {
      // Tính toán giảm giá nếu mã giảm giá áp dụng cho sản phẩm
      totalDiscount = calculateDiscountAmount({
        discountValue: checkDiscount.discount_value,
        totalPrice, // chỉ áp dụng giảm giá cho sản phẩm cụ thể
        discountValueType: checkDiscount.discount_value_type,
      });
    }
  } else if (applicableTo === "order") {
    // Tính toán giảm giá nếu mã giảm giá áp dụng cho toàn bộ đơn hàng
    totalDiscount = calculateDiscountAmount({
      discountValue: checkDiscount.discount_value,
      totalPrice, // áp dụng cho toàn bộ đơn hàng
      discountValueType: checkDiscount.discount_value_type,
      maxValueDiscount: checkDiscount.maximum_discount_value,
    });
  }

  return totalDiscount;
};
// thêm người dùng vào danh sách những người đã sử dụng mã giảm giá
const updateUserToDiscount = async ({ discountCode, user_id }) => {
  const discount = await discountModel
    .findOne({ discount_code: discountCode, is_delete: false })
    .lean();
  if (!discount) {
    throw new NotFoundError("Discount not found");
  }
  const userEntry = discount.discount_user_used.find(
    (entry) => entry.dbu_userId.toString() === user_id.toString()
  );
  if (userEntry) {
    userEntry.count_used += 1;
    discount.max_total_uses -= 1;
    const updatedDiscount = await discountModel.findByIdAndUpdate(
      discount._id,
      {
        discount_user_used: discount.discount_user_used,
        max_total_uses: discount.max_total_uses,
      },
      { new: true, lean: true }
    );
    if (!updatedDiscount) {
      throw new BadRequestError("Update discount failed");
    }
  } else {
    discount.discount_user_used.push({ dbu_userId: user_id, count_used: 1 });
    discount.max_total_uses -= 1;
    const updatedDiscount = await discountModel.findByIdAndUpdate(
      discount._id,
      {
        discount_user_used: discount.discount_user_used,
        max_total_uses: discount.max_total_uses,
      },
      { new: true, lean: true }
    );
    if (!updatedDiscount) {
      throw new BadRequestError("Update discount failed");
    }
  }
  return discount;
};
const getValidDiscounts = async () =>{
  const currentDate = moment();
  const discounts = await discountModel.find({
    is_deleted: false,
    discount_end_date: { $gte: currentDate.toDate() }, 
  }).select('discount_content discount_image discount_end_date discount_code');
  const validDiscounts = discounts.map(discount => {
    const daysLeft = moment(discount.discount_end_date).diff(currentDate, 'days'); 
    return {
      ...discount.toObject(), 
      message: `Hết hạn trong ${daysLeft} ngày`
    };
  })
  if(validDiscounts.length == 0){
    throw new NotFoundError("No active discounts found");
  }
  return validDiscounts;
}
module.exports = {
  createDiscount,
  getDiscountById,
  getDiscountByCode,
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
  updateUserToDiscount,
  getActiveDiscounts,
  checkproductAppliedDiscount,
  calculateDiscountAmount,
  getValidDiscounts
};
