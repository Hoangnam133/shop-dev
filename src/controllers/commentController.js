const CommentService = require('../services/commentService')
const {SuccessResponse} = require('../core/successResponse')
class CommentController{
    createComment = async(req, res, next)=>{
        new SuccessResponse({
            message:'create Success',
            metaData: await CommentService.createComment({
                user: req.user,
                ...req.body

            })
        }).send(res)
    }

    getCommentByParentId = async(req, res, next)=>{
        new SuccessResponse({
            message:'get Success',
            metaData: await CommentService.getCommentByParentId(req.query)
        }).send(res)
    }
    deleteComment = async(req, res, next)=>{
        new SuccessResponse({
            message: "delete comment success",
            metaData: await CommentService.deleteCommet(req.body)
        }).send(res)
    }
}
module.exports = new CommentController()