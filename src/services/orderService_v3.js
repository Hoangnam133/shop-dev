const orderModel = require('../models/orderModel')
const cartModel = require('../models/cartModel')
const productModel = require('../models/productModel')
const discountModel = require('../models/discountModel')
const inventoryModel = require('../models/inventoryModel')
const cartService = require('../services/cartService')
const { convertTimeToVN } = require('../utils/convertTime')
const { processMoMoPayment } = require('../momo/paymentService')
const { NotFoundError, BadRequestError } = require('../core/errorResponse')
const {updateInventoryByProduct} = require('../repositories/inventoryRepository')
class OrderService {
    static calculateDiscount(product, checkDiscount, user, totalPrice) {
        let totalDiscountForProduct = 0;
        
        if (checkDiscount) {
            const discountUserUsed = checkDiscount.discount_user_used.find(du => du.dbu_userId.toString() === user._id.toString());
            if (discountUserUsed && discountUserUsed.count_used >= checkDiscount.max_uses_per_user) {
                throw new BadRequestError('User has exceeded the maximum usage limit for this discount');
            }
            // Kiểm tra giá trị đơn hàng tối thiểu
            if (checkDiscount.min_order_value && checkDiscount.min_order_value > totalPrice) {
                return totalDiscountForProduct; // Không áp dụng giảm giá nếu giá trị đơn hàng chưa đạt
            }
    
            if (checkDiscount.applicable_to === 'product' && checkDiscount.applicable_products.includes(product._id)) {
                // Giảm giá theo sản phẩm
                if (checkDiscount.discount_value_type === 'fixed_amount') {
                    totalDiscountForProduct = Math.min(totalPrice, checkDiscount.discount_value);
                } else if (checkDiscount.discount_value_type === 'percentage') {
                    totalDiscountForProduct = totalPrice * (checkDiscount.discount_value / 100);
                }
            } else if (checkDiscount.applicable_to === 'order') {
                // Giảm giá theo đơn hàng (áp dụng cho tổng đơn hàng)
                if (checkDiscount.discount_value_type === 'fixed_amount') {
                    totalDiscountForProduct = checkDiscount.discount_value;
                } else if (checkDiscount.discount_value_type === 'percentage') {
                    totalDiscountForProduct = totalPrice * (checkDiscount.discount_value / 100);
                }
            }
        }
    
        return totalDiscountForProduct;
    }
    

    static async checkOutReview({ user, discount_code = null, product_ids = [] }) {
        if (!user) throw new NotFoundError('missing user data')
        const cart = await cartModel.findOne({ cart_userId: user._id })
        if (!cart) throw new NotFoundError('not found cart by user')

        const products = await productModel.find({ _id: { $in: product_ids }, isDelete: false, isPublished: true, isDraft: false })
        if (products.length !== product_ids.length) throw new NotFoundError('some products not found')

        const checkDiscount = await discountModel.findOne({ discount_code })
        const inventories = await inventoryModel.find({ inven_productId: { $in: products.map(p => p._id) } })
        
        let totalAmount = 0
        let totalDiscount = 0
        let totalPreparationTime = 0
        const productCheckout = []

        for (const product of products) {
            const productInCart = cart.cart_products.find(item => item.productId.toString() === product._id.toString())
            if (!productInCart) throw new NotFoundError('not found product in cart')

            const inventory = inventories.find(inv => inv.inven_productId.toString() === product._id.toString())
            if (!inventory || productInCart.quantity > inventory.inven_stock) {
                throw new BadRequestError('quantity order product exceed stock')
            }

            const quantity = productInCart.quantity
            const price = product.product_price
            const totalPrice = quantity * price
            const totalTimePre = quantity * product.preparation_time

            const totalDiscountForProduct = checkDiscount && checkDiscount.applicable_products.includes(product._id)
                ? OrderService.calculateDiscount(product, checkDiscount, user, totalPrice)
                : 0
            console.log(`tong giam gia ${totalDiscountForProduct}`)
            totalPreparationTime += totalTimePre
            totalAmount += totalPrice
            totalDiscount += totalDiscountForProduct
            
            productCheckout.push({
                productId: product._id,
                quantity,
                price,
                total_price: totalPrice,
                total_discount: totalDiscountForProduct,
                product_thumb: product.product_thumb
            })
        }

        const finalPrice = totalAmount - totalDiscount
        const convertSecondsToMinutes = totalPreparationTime / 60
        const { deliveryTime, timeOrder } = convertTimeToVN(totalPreparationTime)

        return {
            order_userId: user._id,
            order_checkout: {
                totalAmount,
                totalDiscount,
                final_price: finalPrice,
                preparation_time: convertSecondsToMinutes,
                timeOrder,
                deliveryTime
            },
            order_product: productCheckout
        }
    }

    static async checkOutByUser({ user, product_ids = [], payment_method = 'online_payment' }) {
        if (!user) throw new NotFoundError('missing user data')
        const cart = await cartModel.findOne({ cart_userId: user._id })
        if (!cart) throw new NotFoundError('not found cart by user')
        const { order_checkout, order_product } = await OrderService.checkOutReview({ user, product_ids })
        console.log(order_checkout, order_product)
        const newOrder = await orderModel.create({
            order_userId: user._id,
            order_checkout,
            order_payment: { payment_method },
            order_product,
            order_status: 'pending' 
        })

        if (!newOrder) throw new BadRequestError('order creation failed')
        const paymentUrl =  await processMoMoPayment({orderId: newOrder._id, totalPrice: order_checkout.final_price})
        if (!paymentUrl){
            await orderModel.findByIdAndDelete(newOrder._id)
            throw new BadRequestError('payment initialization failed')
        }
        return {
            order: newOrder,
            paymentUrl
        }
    }
    static async handlePaymentCallback({orderId, statusCode, user}) {
        if (!user) throw new NotFoundError('user data missing')
        const order = await orderModel.findOne({
                _id: orderId,
                order_userId: user._id,
                order_status: 'pending'})
        if (!order) throw new NotFoundError('Order not found')

        if (statusCode === 200) {
            order.order_status = 'Completed'
            order.order_payment.payment_status = 'success'
            for (const { productId, quantity } of order.order_product) {
                await updateInventoryByProduct({ productId, quantity})
            }
            await order.save()
            const productIds = order.order_product.map(item => item.productId)
            for (const productId of productIds) {
                await cartService.deleteProductCart({ user: order.order_userId, product: { productId } })
            }
        }else {
            await orderModel.findByIdAndDelete(orderId)
        }
    }
}

module.exports = OrderService
