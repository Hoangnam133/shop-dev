const { BadRequestError } = require("../core/errorResponse");
const userModel = require("../models/userModel");
const dotenv = require("dotenv");
dotenv.config();
const { removeUndefinedObject } = require("../utils/index");
const shopModel = require("../models/shopModel");
const findByEmail = async (email) => {
  return await userModel.findOne({ email });
};
const findById = async (id) => {
  return await userModel.findById(id);
};
const findShopId = async (id) => {
  return await shopModel.findById({ id });
};
const updateUser = async ({ user, updateData }) => {
  const cleanData = removeUndefinedObject(updateData);
  const updatedUser = await userModel.findByIdAndUpdate(user._id, cleanData, {
    new: true,
    lean: true,
  });
  if (!updatedUser) {
    throw new BadRequestError("update profile failed");
  }
  return updatedUser;
};
// list employees of a specific shop
const listEmployeesOfShop = async (shop_id) => {
  const employees = await userModel
    .find({
      shop_id,
      roles: process.env.ROLES_EMPLOYEE,
    })
    .populate("shop_id", "shop_name");
  const convertedEmployees = employees.map((employee) => {
    return {
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      status: employee.status,
      roles:
        employee.roles === process.env.ROLES_EMPLOYEE
          ? "employee"
          : "forbidden",
      shop_name: employee.shop_id ? employee.shop_id.shop_name : "No Shop",
    };
  });
  return convertedEmployees;
};
// ở đây
// list employees
const listEmployees = async () => {
  const employees = await userModel
    .find({
      roles: process.env.ROLES_EMPLOYEE,
    })
    .populate("shop_id", "shop_name");
  const convertedEmployees = employees.map((employee) => {
    return {
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      status: employee.status,
      roles:
        employee.roles === process.env.ROLES_EMPLOYEE
          ? "employee"
          : "forbidden",
      shop_name: employee.shop_id ? employee.shop_id.shop_name : "No Shop",
    };
  });
  return convertedEmployees;
};
// list managers of a specific shop
const listManageOfShop = async (shop_id) => {
  const managers = await userModel
    .find({
      shop_id,
      roles: process.env.ROLES_BRANCH_MANAGER,
    })
    .populate("shop_id", "shop_name");
  const convertedManagers = managers.map((managers) => {
    return {
      _id: managers._id,
      name: managers.name,
      email: managers.email,
      status: managers.status,
      roles:
        managers.roles === process.env.ROLES_BRANCH_MANAGER
          ? "Manage branch"
          : "forbidden",
      shop_name: managers.shop_id ? managers.shop_id.shop_name : "No Shop",
    };
  });
  return convertedManagers;
};
// list managers
const listManage = async () => {
  const managers = await userModel
    .find({
      roles: process.env.ROLES_BRANCH_MANAGER,
    })
    .populate("shop_id", "shop_name");
  const convertedManagers = managers.map((managers) => {
    return {
      _id: managers._id,
      name: managers.name,
      email: managers.email,
      status: managers.status,
      roles:
        managers.roles === process.env.ROLES_BRANCH_MANAGER
          ? "Manage branch"
          : "forbidden",
      shop_name: managers.shop_id ? managers.shop_id.shop_name : "No Shop",
    };
  });
  return convertedManagers;
};
const updateStatus = async (user_id) => {
  const existingUser = await userModel.findById(user_id);
  try{
    if (!existingUser) {
      throw new BadRequestError("User not found");
    }
    if(existingUser.status === 'active') {
      existingUser.status = 'inactive'
    }
    else {
      existingUser.status = 'active'
    }
    await existingUser.save();
  }catch(error){
    throw new BadRequestError('update status fail')
  }
}
module.exports = {
  findByEmail,
  findById,
  updateUser,
  listEmployeesOfShop,
  listEmployees,
  listManageOfShop,
  listManage,
  findShopId,
  updateStatus,

};
