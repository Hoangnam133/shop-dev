const express = require('express')
const router = express.Router()

const categoryController = require('../../controllers/categoryController')

const { asynHandler } = require('../../utils/handler')
// Tạo danh mục mới
router.post('/create', asynHandler(categoryController.createCategory))

// Lấy tất cả danh mục
router.get('/all', asynHandler(categoryController.getAllCategories))

// Lấy danh mục theo ID
router.get('/:category_id', asynHandler(categoryController.getCategoryById))

// Cập nhật danh mục theo ID
router.put('/:category_id', asynHandler(categoryController.updateCategoryById))

// Xóa danh mục theo ID
router.delete('/:category_id', asynHandler(categoryController.deleteCategoryById))

// Xuất bản danh mục theo ID
router.post('/:category_id/publish', asynHandler(categoryController.publishCategoryById))

// Lấy tất cả danh mục đã công khai
router.get('/published', asynHandler(categoryController.getAllCategoriesIsPublished))

// Lấy tất cả danh mục đã xóa
router.get('/deleted', asynHandler(categoryController.getAllCategoriesIsDeleted))

// Lấy danh mục mới nhất
router.get('/latest', asynHandler(categoryController.getLatestCategories))
module.exports = router
