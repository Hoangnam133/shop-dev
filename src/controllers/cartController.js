const { SuccessResponse } = require('../core/successResponse')
const CartServiceV2 = require('../services/cartService')
class CartController{
  
    addToCart = async(req, res, next)=>{
        console.log('Request body:', req.body)
        new SuccessResponse({
            message: 'add product to cart success',
            metaData: await CartServiceV2.addToCart({
                user: req.user,
                product: req.body
            })
        }).send(res)
    }
    fillQuantityInBlank = async(req, res, next)=>{
        new SuccessResponse({
            message: 'update cart success',
            metaData: await CartServiceV2.fillQuantityInBlank({
                user: req.user,
                product: req.body
            })
        }).send(res)
    }
    deleteCart = async(req, res, next)=>{
        new SuccessResponse({
            message:'delete product in cart :: success',
            metaData: await CartServiceV2.deleteProductCart({
                user: req.user,
                product: req.body
            })
        }).send(res)
    }
    getCartByUser = async(req, res, next)=>{
        new SuccessResponse({
            message: 'get cart success',
            metaData: await CartServiceV2.getCartByUser({
                user: req.user
            })
        }).send(res)
    }
    btnIncOfDec = async(req, res, next)=>{
        new SuccessResponse({
            message: 'update cart success',
            metaData: await CartServiceV2.updateProductQuantityInCart({
                user: req.user,
                product: req.body
            })
        }).send(res)
    }
    
}
module.exports = new CartController()