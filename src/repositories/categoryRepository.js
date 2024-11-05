const { model } = require("mongoose");
const categoryModel = require("../models/categoryModel");
const {
  isDuplicateNameOnCreate,
  removeUndefinedObject,
  isDuplicateUpdateField,
} = require("../utils/index");
const { BadRequestError, NotFoundError } = require("../core/errorResponse");
const productModel = require("../models/productModel");
const createCategory = async (payload) => {
  const { category_name } = payload;
  if (category_name) {
    const checkName = await isDuplicateNameOnCreate({
      model: categoryModel,
      fieldName: "category_name",
      name: category_name,
    });
    if (checkName) {
      throw new BadRequestError("Category name already exists");
    }
  }
  const newCategory = await categoryModel.create(payload);
  if (!newCategory) {
    throw new BadRequestError("Failed to create category");
  }
  return newCategory;
};

const getAllCategories = async () => {
  const categories = await categoryModel
    .find({ isPublished: true, isDeleted: false })
    .lean();
  if (!categories) {
    throw new NotFoundError("No categories found");
  }
  return categories;
};

const getCategoryById = async (category_id) => {
  const category = await categoryModel.findById(category_id).lean();
  if (!category) {
    throw new NotFoundError("Category not found");
  }
  return category;
};

const updateCategoryById = async ({ category_id, payload }) => {
  const checkCategory = await categoryModel.findById(category_id).lean();
  if (!checkCategory) {
    throw new NotFoundError("Category not found");
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
      throw new BadRequestError("Category name already exists");
    }
  }
  const updateCategory = await categoryModel
    .findByIdAndUpdate(category_id, cleanData, { new: true })
    .lean();
  if (!updateCategory) {
    throw new NotFoundError("Failed to update category");
  }
  return updateCategory;
};

const deleteCategoryById = async (category_id) => {
  const checkProductOfCategory = await productModel.find({
    category_id,
  });
  if (checkProductOfCategory && checkProductOfCategory.length > 0) {
    throw new BadRequestError(
      "Category is associated with products. Cannot delete"
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
    throw new NotFoundError("Failed to delete category");
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
    throw new NotFoundError("Failed to publish category");
  }
  return publishedCategory;
};
const getAllCategoriesIsPublished = async () => {
  const categories = await categoryModel
    .find({ isPublished: true, isDeleted: false })
    .lean();
  if (!categories) {
    throw new NotFoundError("No categories found");
  }
  return categories;
};

const getAllCategoriesIsDeleted = async () => {
  const categories = await categoryModel
    .find({ isDeleted: true, isPublished: false })
    .lean();
  if (!categories) {
    throw new NotFoundError("No categories found");
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
    throw new NotFoundError("No latest categories found");
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
