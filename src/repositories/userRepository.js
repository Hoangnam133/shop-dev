const { BadRequestError } = require('../core/errorResponse')
const userModel = require('../models/userModel')
const {removeUndefinedObject} = require('../utils/index')
const findByEmail = async(email)=>{
    return await userModel.findOne({email})
}
const findById = async(id)=>{
    return await userModel.findById(id)
}
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
module.exports = {
    findByEmail,
    findById,
    updateUser
}