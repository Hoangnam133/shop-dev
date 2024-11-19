const shopModel = require("../models/shopModel");
const { findByEmail, findById } = require("../repositories/userRepository");
const { BadRequestError } = require("../core/errorResponse");
const { getInfoData } = require("../utils");
const { removeUndefinedObject, toObjectId } = require("../utils/index");
const uploadService = require("../services/uploadService");
class ShopService {
  static createShop = async ({ user, payload, file }) => {
    if (!user) {
      throw new BadRequestError("not found user");
    }
    // Kiểm tra xem tên shop đã tồn tại trong cùng khu vực chưa
    const existingShop = await shopModel.findOne({
      shop_name: payload.shop_name,
      location_id: payload.location_id,
    });

    if (existingShop) {
      throw new BadRequestError("Shop name already exists in this location");
    }
    if(!file){
      throw new BadRequestError("shop image is required");
    }
    const uploadImg = await uploadService.uploadImageFromLocalS3(file)
    if(!uploadImg){
      throw new BadRequestError('Error uploading file to S3')
    }
    payload.shop_image = uploadImg;
    const newShop = await shopModel.create({
      location_id: payload.location_id,
      shop_owner: user._id,
      shop_name: payload.shop_name,
      shop_image: payload.shop_image
    });
    return {
      shop: getInfoData({
        fileds: ["shop_name", "location_id", "shop_image"],
        object: newShop,
      }),
    };
  };
  static updateShop = async ({ shop_id, user, payload, file }) => {
    if (!user) {
      throw new BadRequestError("not found user");
    }
    console.log(shop_id);

    // Tìm shop theo ID, không sử dụng findOne
    const foundShop = await shopModel.findById(shop_id);
    if (!foundShop) {
      throw new BadRequestError("not found shop");
    }

    const cleanedUpdate = removeUndefinedObject(payload);
    if(file){
      const uploadImg = await uploadService.uploadImageFromLocalS3(file)
      if(!uploadImg){
        throw new BadRequestError('Error uploading file to S3')
      }
      cleanedUpdate.shop_image = uploadImg
    }
    const updatedShop = await shopModel.findByIdAndUpdate(
      shop_id,
      cleanedUpdate,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedShop) {
      throw new BadRequestError("update shop fail");
    }

    return {
      shop: getInfoData({
        fileds: ["shop_name", "shop_location", "shop_image"],
        object: updatedShop,
      }),
    };
  }
  static async getAllShop(){
    const shops = await shopModel.find()
    if(!shops){
      throw new BadRequestError("not found shops")
    }
    return shops
  }
  static async getShopById(shop_id){
    const shop = await shopModel.findById(shop_id)
    if(!shop){
      throw new BadRequestError("not found shop")
    }
    return shop
  }
}
module.exports = ShopService;
