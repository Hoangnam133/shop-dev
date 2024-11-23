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
    if (!file) {
      throw new BadRequestError("shop image is required");
    }
    const uploadImg = await uploadService.uploadImageFromLocalS3(file);
    if (!uploadImg) {
      throw new BadRequestError("Error uploading file to S3");
    }
    payload.shop_image = uploadImg;
    const newShop = await shopModel.create({
      location_id: payload.location_id,
      shop_owner: user._id,
      shop_name: payload.shop_name,
      shop_image: payload.shop_image,
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
    if (file) {
      const uploadImg = await uploadService.uploadImageFromLocalS3(file);
      if (!uploadImg) {
        throw new BadRequestError("Error uploading file to S3");
      }
      cleanedUpdate.shop_image = uploadImg;
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
  };
  static async getAllShop() {
    const shops = await shopModel.find();
    console.log(shops);
    if (!shops) {
      throw new BadRequestError("not found shops");
    }
    return shops;
  }
  static async getAllShop() {
    const shops = await shopModel.find();
    if (!shops) {
      throw new BadRequestError("Shops not found");
    }
    return shops;
  }

  static async getAllShopsWithLocation() {
    try {
      // Lấy danh sách cửa hàng cùng với thông tin từ location_id
      const shops = await shopModel
        .find({ status: "active" }) // Chỉ lấy cửa hàng active
        .populate({
          path: "location_id",
          select: "location_name latitude longitude googleMapsLink", // Chỉ lấy các trường cần thiết
        });

      // Định dạng lại dữ liệu trả về
      return shops.map((shop) => ({
        shop_name: shop.shop_name,
        location_name: shop.location_id?.location_name || "Không có địa chỉ", // Tên địa chỉ
        coordinates: {
          latitude: shop.location_id?.latitude || 0,
          longitude: shop.location_id?.longitude || 0,
        },
        googleMapsLink: shop.location_id?.googleMapsLink || "",
        description: shop.description || "",
        status: shop.status,
        shop_image: shop.shop_image,
      }));
    } catch (err) {
      console.error("Lỗi khi xử lý dữ liệu trong service:", err.message);
      throw new Error(err.message || "Không thể lấy danh sách cửa hàng");
    }
  }

  static async getShopById(shop_id) {
    const shop = await shopModel.findById(shop_id).populate({
      path: "opening_hours",
      select: "monday tuesday wednesday thursday friday saturday sunday",
    });
    if (!shop) {
      throw new BadRequestError("not found shop");
    }
    return shop;
  }
}
module.exports = ShopService;
