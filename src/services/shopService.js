const shopModel = require("../models/shopModel");
const { findByEmail, findById } = require("../repositories/userRepository");
const { BadRequestError } = require("../core/errorResponse");
const { getInfoData } = require("../utils");
const { removeUndefinedObject } = require("../utils/index");
class ShopService {
  static createShop = async ({ user, shop_name, location_id, shop_image }) => {
    if (!user) {
      throw new BadRequestError("not found user");
    }
    // Kiểm tra xem tên shop đã tồn tại trong cùng khu vực chưa
    const existingShop = await shopModel.findOne({
      shop_name: shop_name,
      location_id: location_id,
    });

    if (existingShop) {
      throw new BadRequestError("Shop name already exists in this location");
    }
    const newShop = await shopModel.create({
      shop_name,
      location_id,
      shop_image,
      shop_owner: user._id,
    });
    return {
      shop: getInfoData({
        fileds: ["shop_name", "location_id", "shop_image"],
        object: newShop,
      }),
    };
  };
  static updateShop = async ({ shop_id, user, bodyUpdate }) => {
    if (!user) {
      throw new BadRequestError("not found user");
    }
    console.log(shop_id);

    // Tìm shop theo ID, không sử dụng findOne
    const foundShop = await shopModel.findById(shop_id);
    if (!foundShop) {
      throw new BadRequestError("not found shop");
    }

    const cleanedUpdate = removeUndefinedObject(bodyUpdate);

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
  };
}
module.exports = ShopService;
