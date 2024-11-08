const express = require('express')
const router = express.Router()
const { asyncHandler } = require('../../utils/handler')
const uploadController = require('../../controllers/uploadController')
const {uploadDisk, uploadMemory} = require('../../configs/multer.config')
router.post('/uploadImages3', uploadMemory.single('file'),asyncHandler(uploadController.uploadImageFromLocalS3))
module.exports = router