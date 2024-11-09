const orderService = require('../models/orderModel')
const {getCartByUserId} = require('../repositories/cartRepository_v2')
const {BadRequestError, NotFoundError} = require('../core/errorResponse')
const userModel = require('../models/userModel')
const shopModel = require('../models/shopModel')
const {checkProductStockInShop} = require('../repositories/inventoryRepository')
const productModel = require('../models/productModel')
const {getDiscountByCode, checkproductAppliedDiscount, checkDiscountApplicable, calculateDiscountAmount} = require('../repositories/discountRepository')
const {checkDeliveryTimeForShop, checkImmediateDeliveryTime} = require('../repositories/openingHoursRepository')
const orderModel = require('../models/orderModel')
class OrderServiceV5{
    static async checkoutPreview({user, shop, products_ids = [], discount_code}){
        console.log(`product_ids: ${products_ids}`)
        const foundUser = await userModel.findById(user._id)
        const foundShop = await shopModel.findById(shop._id)
        if(!foundUser || !foundShop){
            throw new NotFoundError('User or shop not found')
        }
        const cart = await getCartByUserId(foundUser._id)
        if(!cart){
            throw new NotFoundError('Cart not found')
        }
        const products = await productModel.find({
            _id: { $in: products_ids }
        })
        if (products.length !== products_ids.length) 
            throw new NotFoundError('some products not found');
        let productCheckout = []
        let totalDiscount = 0
        let finalPrice = 0
        let totalPrice = 0
        let totalMinutes = 0
        const checkDiscount = await getDiscountByCode(discount_code)
        for(const product of products){
            const foundProduct = await productModel.findOne({_id: product._id})
            if(!foundProduct){
                throw new NotFoundError(`${foundProduct.product_name} not found`)
            }
            const productInCart = cart.cart_products.find(item => item.product_id.toString() === product._id.toString())
            if(!productInCart){
                throw new NotFoundError(`${foundProduct.product_name} not found in cart`)
            }
            const checkStockProduct = await checkProductStockInShop({
                shop_id: foundShop._id,
                quantity: productInCart.quantity,
                product_id: product._id,
            })
            if(!checkStockProduct){
                throw new BadRequestError(`${foundProduct.product_name} Not enough stock`)
            }
            const quantity = productInCart.quantity
            const price = foundProduct.product_price
            totalMinutes += quantity * foundProduct.preparation_time
            var itemTotalPrice = quantity * price
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
            productCheckout.push({
                product_id: product._id,
                quantity,
                price,
                totalPrice: itemTotalPrice,
                product_thumb: foundProduct.product_thumb,
                product_name: foundProduct.product_name,
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
    static async checkout({user, shop, products_ids = [], discount_code,  selectedDeliveryTime, note}){
        const {productCheckout,
            totalPrice,
            totalDiscount,
            finalPrice,
            totalMinutes} = await OrderServiceV5.checkoutPreview({user, shop, products_ids, discount_code})
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
        const newOrder = orderModel.create(payload)
        if(!newOrder){
            throw new BadRequestError('order creation failed')
        }
        return newOrder
    }
}
module.exports = OrderServiceV5