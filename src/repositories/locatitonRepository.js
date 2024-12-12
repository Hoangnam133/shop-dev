const locationModel = require("../models/locationModel");
const { BadRequestError, NotFoundError } = require("../core/errorResponse");
const {
  removeUndefinedObject,
  isDuplicateNameOnCreate,
} = require("../utils/index");
const userModel = require("../models/userModel");
const dotenv = require("dotenv");

dotenv.config();
const createLocation = async ({ payload, user }) => {
  const { location_name } = payload;
  if (!user) {
    throw new BadRequestError("User not found");
  }
  const checkRoles = await userModel.findOne({
    _id: user._id,
    roles: process.env.ROLES_ADMIN,
  });
  if (!checkRoles) {
    throw new BadRequestError(
      "Người dùng không có đủ quyền hạn để thực hiện hành động này"
    );
  }
  // Kiểm tra trùng lặp địa điểm
  if (location_name) {
    const checkName = await isDuplicateNameOnCreate({
      model: locationModel,
      fieldName: "location_name",
      name: location_name,
    });
    if (checkName) {
      throw new BadRequestError("Tên địa điểm đã tồn tại");
    }
  }
  const newLocation = await locationModel.create(payload);
  if (!newLocation) {
    throw new BadRequestError("Tạo vị trí không thành công");
  }
  return newLocation;
};

const getAllLocations = async () => {
  const locations = await locationModel
    .find({
      isDeleted: false,
    })
    .lean();
  if (!locations) {
    throw new NotFoundError("không tìm thấy vị trí nào");
  }
  return locations;
};

const getLocationById = async ({ location_id }) => {
  const location = await locationModel.findById(location_id).lean();
  if (!location) throw new NotFoundError("không tìm thấy vị trí");
  return location;
};

const updateLocationById = async ({ location_id, payload, user }) => {
  if (!user) {
    throw new BadRequestError("có một chút lỗi xảy ra. Vui lòng thử lại sau");
  }
  const checkRoles = await userModel.findOne({
    _id: user._id,
    roles: process.env.ROLES_ADMIN,
  });
  const cleanData = removeUndefinedObject(payload);
  const updatedLocation = await locationModel
    .findByIdAndUpdate(location_id, cleanData, { new: true })
    .lean();
  if (!updatedLocation) {
    throw new NotFoundError("không tìm thấy vị trí");
  }
  return updatedLocation;
};

const deleteLocationById = async ({ location_id, user }) => {
  if (!user) {
    throw new BadRequestError("có một chút lỗi xảy ra. Vui lòng thử lại sau");
  }
  const checkRoles = await userModel.findOne({
    _id: user._id,
    roles: process.env.ROLES_ADMIN,
  });
  const updateLocation = await locationModel
    .findByIdAndUpdate(location_id, { isDeleted: true })
    .lean();
  if (!updateLocation) {
    throw new NotFoundError("không tìm thấy vị trí");
  }
  return updateLocation;
};

module.exports = {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocationById,
  deleteLocationById,
};
