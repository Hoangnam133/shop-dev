const express = require('express')
const {authentication, authorizeRoles} = require('../../auth/authUtils')
const router = express.Router()

const categoryController = require('../../controllers/categoryController')

const { asynHandler } = require('../../utils/handler')
router.get('/listPublish',asynHandler(categoryController.showAllPublishCategories))
router.get('/getSubCategories/:category_id',asynHandler(categoryController.getAllSubCategories))

router.use(authentication)
router.post('/create', authorizeRoles('ADMIN'),asynHandler(categoryController.createCategory))
router.post('/publish/:id_type', authorizeRoles('ADMIN'),asynHandler(categoryController.publishCategory))
router.patch('/delete/:id_type', authorizeRoles('ADMIN'),asynHandler(categoryController.deleteCategory))
router.get('/listUnpublish', authorizeRoles('ADMIN'),asynHandler(categoryController.showAllUnpublishCategories))
router.get('/listDeleted', authorizeRoles('ADMIN'),asynHandler(categoryController.showAllDeletedCategories))
router.patch('/update/:category_id', authorizeRoles('ADMIN'),asynHandler(categoryController.updateCategory))
module.exports = router
