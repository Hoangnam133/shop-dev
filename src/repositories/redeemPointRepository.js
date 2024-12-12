const redeemPointModel = require('../models/redeemPointModel')
const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const moment = require('moment-timezone')
const slugify = require("slugify")
const {NotFoundError, BadRequestError} = require('../core/errorResponse')
// các mã đổi điểm đã đổi
const getRedeemPointsUsed = async ({user, limit = 10, page = 1})=>{
    if(!user){
        throw new NotFoundError('có một chút lỗi xảy ra, vui lòng thử lại')
    }
    const skip = (page - 1) * limit
    const usedRedeemPoints = await redeemPointModel.find({user_id: user._id, status: true})
    .skip(skip)
    .limit(limit)
    .lean()
    return usedRedeemPoints
}
// các mã đổi điểm chưa đổi và còn hạn
const getRedeemPointsNotUsed = async ({user, limit = 10, page = 1})=>{
    if(!user){
        throw new NotFoundError('có một chút lỗi xảy ra, vui lòng thử lại')
    }
    const skip = (page - 1) * limit
    const usedRedeemPoints = await redeemPointModel.find({user_id: user._id, status: false})
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limit)
    .lean()
    for(let item of usedRedeemPoints){
        await updateisExpired(item._id)
    }
    return usedRedeemPoints
}
// cập nhật những mã đổi điểm đã hết hạn
const updateisExpired = async(redeemPoint_id)=>{
    const redeemPoint = await redeemPointModel.findById(redeemPoint_id)
    if(!redeemPoint){
        throw new NotFoundError('có một chút lỗi xảy ra, vui lòng thử lại')
    }
    const now = moment.tz('Asia/Ho_Chi_Minh')
    const expiryDate = moment(redeemPoint.expiry_date)
    if (expiryDate.isBefore(now)) {
        const updateRe = await redeemPointModel.findByIdAndUpdate(redeemPoint._id, {
            isExpired: true
        })
        if(!updateRe){
            throw new Error('có một chút lỗi xảy ra, vui lòng thử lại')
        }
    }
}
// generate chuỗi 4 kí tự ngẫu nhiên
const generateRandomString = (length) => {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
// tạo mã phiếu đổi
const generateCode = (product_name) => {
    const slug = slugify(product_name, { lower: true });
    const productPart = slug.slice(0, 2); // Lấy 3 ký tự đầu tiên
    const currentTime = moment().format("YYYYMMDDHHMMSS");
    const timePart = currentTime.slice(-3); 
    const randomPart = generateRandomString(5);
    const redeemCode = productPart + timePart + randomPart;
    return redeemCode;
}
// tạo phiếu đổi điểm
const createRedeemPoints = async({user, product_id})=>{
    const product = await productModel.findById(product_id);
    if(!product){
        throw new NotFoundError('có một chút lỗi xảy ra, vui lòng thử lại')
    }
    const checkPointUser = await userModel.findById(user._id)
    if(checkPointUser.points < 0 || checkPointUser.points < product.required_points){
        throw new BadRequestError('Bạn không đủ điểm để đổi')
    }
    const redeemCode = generateCode(product.product_name);
    const newRedeemPoints = await redeemPointModel.create({
        user_id: user._id,
        redeem_content: 'sản phẩm bạn đổi' +" " + product.product_name,
        redeem_code: redeemCode,
        redeem_points: product.required_points
    })
    if(newRedeemPoints){
        const updatePointUser = await userModel.findByIdAndUpdate(user._id, {
            $inc: { points: -product.required_points }
        })
        if(!updatePointUser){
            throw new BadRequestError('có một chút lỗi xảy ra, vui lòng thử lại')
        }
    }
    else{
        throw new BadRequestError('có một chút lỗi xảy ra, vui lòng thử lại')
    }
    return newRedeemPoints
}

module.exports = {
    createRedeemPoints,
    getRedeemPointsUsed,
    getRedeemPointsNotUsed
}