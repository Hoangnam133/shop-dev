const { model } = require("mongoose");
const categoryModel = require("../models/categoryModel");
const {
  isDuplicateNameOnCreate,
  removeUndefinedObject,
  isDuplicateUpdateField,
} = require("../utils/index");
const { BadRequestError, NotFoundError } = require("../core/errorResponse");
const productModel = require("../models/productModel");
const uploadService = require("../services/uploadService");
const createCategory = async (payload, file) => {
  let { category_name, category_images } = payload;
  if (category_name) {
    const checkName = await isDuplicateNameOnCreate({
      model: categoryModel,
      fieldName: "category_name",
      name: category_name,
    });
    if (checkName) {
      throw new BadRequestError(`danh mục ${category_name} đã tồn tại. Không thể tạo mới`);
    }
  }
  if (!file) {
    throw new BadRequestError('danh mục cần hình ảnh');
  }
  const uploadImg = await uploadService.uploadImageFromLocalS3(file)
  if (!uploadImg) {
    throw new BadRequestError("cập nhật hình ảnh cho danh mục thất bại, vui lòng thử lại sau");
  }
  payload.category_images = uploadImg
  const newCategory = await categoryModel.create(payload);
  if (!newCategory) {
    throw new BadRequestError("không thể tạo danh mục, vui lòng thử lại sau");
  }
  return newCategory;
};

const getAllCategories = async () => {
  const categories = await categoryModel
    .find({ isPublished: true, isDeleted: false })
    .lean();
  if (!categories) {
    throw new NotFoundError("bạn không có danh mục nào");
  }
  return categories;
};

const getCategoryById = async (category_id) => {
  const category = await categoryModel.findById(category_id).lean();
  if (!category) {
    throw new NotFoundError("không tìm thấy danh mục");
  }
  return category;
};

const updateCategoryById = async ({ category_id, payload, file }) => {
  const checkCategory = await categoryModel.findById(category_id).lean();
  if (!checkCategory) {
    throw new NotFoundError("không tìm thấy danh mục");
  }
  const cleanData = removeUndefinedObject(payload);
  if (cleanData.category_name) {
    const existingCategory = await isDuplicateUpdateField({
      model: categoryModel,
      fieldName: "category_name",
      excludeId: category_id,
      value: cleanData.category_name,
    });
    if (existingCategory) {
      throw new BadRequestError(`danh mục ${category_name} đã tồn tại. Không thể tạo mới`);
    }
  }
  if(file){
    const uploadImg = await uploadService.uploadImageFromLocalS3(file)
    if (!uploadImg) {
      throw new BadRequestError("cập nhật hình ảnh cho danh mục thất bại");
    }
    cleanData.category_images = uploadImg
  }
  const updateCategory = await categoryModel
    .findByIdAndUpdate(category_id, cleanData, { new: true })
    .lean();
  if (!updateCategory) {
    throw new NotFoundError("không thể cập nhật danh mục, vui lòng thử lại sau");
  }
  return updateCategory;
};

const deleteCategoryById = async (category_id) => {
  const checkProductOfCategory = await productModel.find({
    category_id,
  });
  if (checkProductOfCategory && checkProductOfCategory.length > 0) {
    throw new BadRequestError(
      "trong danh mục này còn sản phẩm, không thể xóa"
    );
  }
  const deletedCategory = await categoryModel
    .findByIdAndUpdate(
      category_id,
      { isDeleted: true, isPublished: false },
      { new: true }
    )
    .lean();
  if (!deletedCategory) {
    throw new NotFoundError("xóa danh mục thất bại. Vui lòng thử lại sau");
  }
  return deletedCategory;
};

const publishCategoryById = async (category_id) => {
  const publishedCategory = await categoryModel
    .findByIdAndUpdate(
      category_id,
      { isPublished: true, isDeleted: false },
      { new: true }
    )
    .lean();
  if (!publishedCategory) {
    throw new NotFoundError("không thể công khai danh mục. Vui lòng thử lại sau");
  }
  return publishedCategory;
};
const getAllCategoriesIsPublished = async () => {
  const categories = await categoryModel
    .find({ isPublished: true, isDeleted: false })
    .lean();
  if (!categories) {
    throw new NotFoundError("danh sách danh mục không tồn tại");
  }
  return categories;
};

const getAllCategoriesIsDeleted = async () => {
  const categories = await categoryModel
    .find({ isDeleted: true, isPublished: false })
    .lean();
  if (!categories) {
    throw new NotFoundError("danh sách danh mục không tồn tại");
  }
  return categories;
};
const getLatestCategories = async (limit) => {
  const latestCategories = await categoryModel
    .find({ isPublished: true, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  if (!latestCategories || latestCategories.length === 0) {
    throw new NotFoundError("danh sách danh mục không tồn tại");
  }
  return latestCategories;
};
module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
  publishCategoryById,
  getAllCategoriesIsPublished,
  getAllCategoriesIsDeleted,
  getLatestCategories,
};
