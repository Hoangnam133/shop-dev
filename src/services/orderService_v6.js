const {getCartByUserId} = require('../repositories/cartRepository_v2')
const {BadRequestError, NotFoundError} = require('../core/errorResponse')
const userModel = require('../models/userModel')
const shopModel = require('../models/shopModel')
const {checkProductStockInShop} = require('../repositories/inventoryRepository')
const productModel = require('../models/productModel')
const {getDiscountByCode, checkproductAppliedDiscount, checkDiscountApplicable, calculateDiscountAmount} = require('../repositories/discountRepository')
const {checkDeliveryTimeForShop, checkImmediateDeliveryTime} = require('../repositories/openingHoursRepository')
const orderModel = require('../models/orderModel')
const {deductStockAfterPayment} = require('../repositories/inventoryRepository')
const {listOrderCancelledOfUser, listOrderCompletedOfUser, listOrderPendingOfUser, listOrderSuccessOfUser
    ,updateStatusCancelled, updateStatusCompleted, listOrderPending, listOrderSuccess, listOrderCancelled, listOrderCompleted
} = require('../repositories/orderRepository')
class OrderServiceV5{
    static async listOrderCancelledOfUser(user){
        return await listOrderCancelledOfUser(user)
    }
    static async listOrderCompletedOfUser(user){
        return await listOrderCompletedOfUser(user)
    }
    static async list_OrderPendingOfUser(user){
        return await listOrderPendingOfUser(user)
    }
    static async listOrderSuccessOfUser(user){
        return await listOrderSuccessOfUser(user)
    }
    static async updateStatusCancelled(order_id){
        return await updateStatusCancelled(order_id)
    }
    static async updateStatusCompleted(order_id){
        return await updateStatusCompleted(order_id)
    }
    static async listOrderPending({limit = 10, page = 1}){
        return await listOrderPending({limit, page})
    }
    static async listOrderSuccess({limit = 10, page = 1}){
        return await listOrderSuccess({limit, page})
    }
    static async listOrderCancelled({limit = 10, page = 1}){
        return await listOrderCancelled({limit, page})
    }
    static async listOrderCompleted({limit = 10, page = 1}){
        return await listOrderCompleted({limit, page})
    }
    static async checkoutPreview({user, shop, discount_code}){
       
        const foundUser = await userModel.findById(user._id)
        const foundShop = await shopModel.findById(shop._id)
        if(!foundUser || !foundShop){
            throw new NotFoundError('User or shop not found')
        }
        const cart = await getCartByUserId(foundUser._id)
        if(!cart){
            throw new NotFoundError('Cart not found')
        }
        let productCheckout = []
        let totalDiscount = 0
        let finalPrice = 0
        let totalPrice = 0
        let totalMinutes = 0
        const checkDiscount = await getDiscountByCode(discount_code)
        for(const product of cart.cart_products){
            const foundProduct = await productModel.findOne({_id: product.product_id})
            if(!foundProduct){
                throw new NotFoundError(`${foundProduct.product_name} not found`)
            }
            const checkStockProduct = await checkProductStockInShop({
                shop_id: foundShop._id,
                quantity: product.quantity,
                product_id: product.product_id,
            })
            if(!checkStockProduct){
                throw new BadRequestError(`${foundProduct.product_name} Not enough stock`)
            }
            totalMinutes += product.quantity * foundProduct.preparation_time
            var itemTotalPrice = product.totalPrice
            totalPrice += itemTotalPrice
            let discountForProduct = 0
            if(checkDiscount && checkDiscount.applicable_to === 'product'){
                const checkTypeDiscount = await checkDiscountApplicable(checkDiscount, 'product')
                if(!checkTypeDiscount){
                    throw new BadRequestError(`Invalid discount code`)
                }
                else{
                    const applicableProducts = await checkproductAppliedDiscount(checkTypeDiscount, foundProduct)
                    if(applicableProducts){
                        discountForProduct = calculateDiscountAmount({
                            discountValue: checkTypeDiscount.discount_value,
                            totalPrice,
                            discountValueType: checkTypeDiscount.discount_value_type,
                            maxValueDiscount: checkTypeDiscount.maximum_discount_value,
                        })
                    }
                }
            }
            finalPrice += itemTotalPrice - discountForProduct
            totalDiscount += discountForProduct
            let sideDishes = product.sideDishes.map((sideDish) => ({
                sideDish_id: sideDish.sideDish_id,
                quantity: sideDish.quantity,
                sideDish_name: sideDish.sideDish_name,
            }));
            productCheckout.push({
                product_id: foundProduct._id,
                product_thumb: foundProduct.product_thumb,
                product_name: foundProduct.product_name,
                extra: sideDishes,
                quantity: product.quantity,
                totalPrice: itemTotalPrice,
                discountForProduct
            })
        }
        if(checkDiscount && totalDiscount === 0){
            const checkTypeDiscount = await checkDiscountApplicable(checkDiscount, 'order')
            if(!checkTypeDiscount){
                throw new BadRequestError(`Invalid discount code`)
            }
            else{
                totalDiscount = calculateDiscountAmount({
                    discountValue: checkTypeDiscount.discount_value,
                    totalPrice: itemTotalPrice,
                    discountValueType: checkTypeDiscount.discount_value_type,
                    maxValueDiscount: checkTypeDiscount.maximum_discount_value,
                })
                finalPrice =totalPrice - totalDiscount
            }
        }
        return {
            productCheckout,
            totalPrice,
            totalDiscount,
            finalPrice,
            totalMinutes
        }
    }
    static async checkout({user, shop, discount_code,  selectedDeliveryTime, note}){
        const {productCheckout,
            totalPrice,
            totalDiscount,
            finalPrice,
            totalMinutes} = await OrderServiceV5.checkoutPreview({user, shop, discount_code})
        let estimated_delivery, options_delivery
        if(selectedDeliveryTime){
            console.log("Selected Delivery Time:", selectedDeliveryTime);
            const checkTime = await checkDeliveryTimeForShop({shop_id: shop._id, selectedDeliveryTime, totalMinutes})
            if(checkTime){
                estimated_delivery = selectedDeliveryTime
                options_delivery = "specific_time"
            }
            else{
                throw new BadRequestError('Invalid delivery time')
            }
        }
        else{
            const checkTimeImmediate = await checkImmediateDeliveryTime({shop_id: shop._id, totalMinutes})
            if(checkTimeImmediate === false){
                throw new BadRequestError('Shop is not open during this time')
            }
            else{
                estimated_delivery = checkTimeImmediate
                options_delivery = "asap"
            }
        }
        const order_time = new Date()
        const payload = {
            order_checkout:{
                totalAmount: totalPrice,
                finalPrice,
                totalDiscount
            },
            order_payment:{
                payment_method: 'online_payment',
                payment_status: 'success'
            },
            options_delivery,
            order_product: productCheckout,
            order_status: 'pending',
            order_discount_code: discount_code,
            estimated_delivery_time: estimated_delivery,
            order_time, 
            note
        }
        console.log('đã  chạy đến đây LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL')
        // sai ngay đây 
        const newOrder = await orderModel.create(payload)
        if(!newOrder){
            throw new BadRequestError('order creation failed')
        }
        return newOrder
    }
    // xử lý sản phẩm trong kho (viết ở repository) ok
    // tích hợp món phụ vào
    // tích hợp thanh toán
    // send thông báo khi đặt hàng thành công
    // đổi điểm nữa
}
module.exports = OrderServiceV5