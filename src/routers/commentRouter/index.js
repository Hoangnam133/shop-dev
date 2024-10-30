const express = require('express')
const {authentication, authorizeRoles} = require('../../auth/authUtils')
const router = express.Router()

const commentController = require('../../controllers/commentController')
const { asynHandler } = require('../../utils/handler')

router.use(authentication)
router.post('/create', asynHandler(commentController.createComment))
router.get('/get', asynHandler(commentController.getCommentByParentId))
router.delete('/delete', asynHandler(commentController.deleteComment))
module.exports = router
