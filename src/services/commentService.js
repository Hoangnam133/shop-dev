const { NotFoundError } = require('../core/errorResponse')
const commentModel = require('../models/commentModel')
const { getProductById } = require('../repositories/productRepository')
class CommentService{
    static async createComment({
        productId, user, content, parentCommentId = null
    }){
        console.log(productId)
        const comment = new commentModel({
            comment_productId: productId,
            comment_userId: user._id,
            comment_content: content,
            comment_parentId: parentCommentId
        })
        let rightValue
        if(parentCommentId){
            const parentComment = await commentModel.findById(parentCommentId)
            if(!parentComment){
                throw new NotFoundError('parent Not Found')
            }
            rightValue = parentComment.comment_right
            await commentModel.updateMany({
                comment_productId: productId,
                comment_right:{
                    $gte: rightValue
                }
            },{
                $inc:{
                    comment_right: 2
                }
            })
            await commentModel.updateMany({
                comment_productId: productId,
                comment_left:{
                    $gt: rightValue
                }
            },{
                $inc:{
                    comment_left: 2
                }
            })
            
        }
        else{
            const maxRightValue = await commentModel.findOne({
                comment_productId: productId
            },'comment_right',{sort: {comment_right: -1}})
            if(maxRightValue){
                rightValue = maxRightValue.comment_right + 1
            }
            else{
                rightValue = 1
            }
        }
        comment.comment_left = rightValue
        comment.comment_right = rightValue + 1
        comment.save()
        return comment
    }
    static async getCommentByParentId({
        productId,
        parentCommentId = null,
        limit = 10,
        offSet = 0 // skip
    }){
        const cleanProductId = productId.trim()
        const cleanparentCommentId = parentCommentId.trim()
        if(cleanparentCommentId){
            const parent = await commentModel.findById(cleanparentCommentId)
            if(!parent){
                throw new NotFoundError('not found comment for product')
            }
            const comments = await commentModel.find({
                comment_productId: cleanProductId,
                comment_left: {$gt: parent.comment_left},
                comment_right: {$lte: parent.comment_right}
            }).select({
                comment_left: 1,
                comment_right: 1,
                comment_content: 1,
                comment_parentId: 1
            }).sort({
                comment_left: 1
            })
            return comments
        }
        const comments = await commentModel.find({
            comment_productId: cleanProductId,
            comment_parentId: cleanparentCommentId
        }).select({
            comment_left: 1,
            comment_right: 1,
            comment_content: 1,
            comment_parentId: 1
        }).sort({
            comment_left: 1
        })
        return comments

    }
    static async deleteCommet({productId, commentId}){
        const foundProduct = await getProductById(productId)
        if(!foundProduct) throw new NotFoundError('not found product')
        
        const foundComment = await commentModel.findById(commentId)
        if(!foundComment) throw new NotFoundError('not found comment')
        
        const leftValue = foundComment.comment_left
        const rightValue = foundComment.comment_right
        const width = rightValue - leftValue + 1
        // delete comment
        await commentModel.deleteMany({
            comment_productId: productId,
            comment_left: {
                $gte: leftValue,
                $lte: rightValue
            }
        })
        // update right
        await commentModel.updateMany({
            comment_productId: productId,
            comment_right:{
                $gte: rightValue
            }
        },{
            $inc: {comment_right: - width}
        })
        // update left
        await commentModel.updateMany({
            comment_productId: productId,
            comment_left:{
                $gte: rightValue
            }
        },{
            $inc: {comment_left: - width}
        })
        return true
    }
}
module.exports = CommentService