const cartServiceV2 = require('../services/cartService_v2')
const {SuccessResponse} = require('../core/successResponse')
class CartV2Controller{
    addToCart = async(req, res, next)=>{
        console.log('Request body:', req.body)
        new SuccessResponse({
            message: 'add product to cart success',
            metaData: await cartServiceV2.addTocart({
                user: req.user,
                product: req.body,
                shop: req.shop
            })
        }).send(res)
    }
    deleteProductInCart = async(req, res, next)=>{
        new SuccessResponse({
            message: 'delete product in cart success',
            metaData: await cartServiceV2.deleteProductInCart({
                user: req.user,
                product: req.body
            })
        }).send(res)
    }
    incProductQuantity = async(req, res, next)=>{
        new SuccessResponse({
            message: 'update inc cart success',
            metaData: await cartServiceV2.incOfDecProductQuantity({
                user: req.user,
                product: req.body,
                shop: req.shop,
                action: 'inc'
            })
        }).send(res)
    }
    DecProductQuantity = async(req, res, next)=>{
        new SuccessResponse({
            message: 'update dec cart success',
            metaData: await cartServiceV2.incOfDecProductQuantity({
                user: req.user,
                product: req.body,
                shop: req.shop,
                action: 'dec'
            })
        }).send(res)
    }
    getCartByUserId = async(req, res, next)=>{
        new SuccessResponse({
            message: 'get cart success',
            metaData: await cartServiceV2.getCartByUserId({
                user: req.user
            })
        }).send(res)
    }
}
module.exports = new CartV2Controller()