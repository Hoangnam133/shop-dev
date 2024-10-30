const orderModel = require('../models/orderModel')
const cartModel = require('../models/cartModel')
const {calculateDiscount, updateUserToDiscount} = require('../repositories/discountRepository')
const productModel = require('../models/productModel')
const discountModel = require('../models/discountModel')
const inventoryModel = require('../models/inventoryModel')
const cartService = require('../services/cartService')
const { processMoMoPayment } = require('../momo/paymentService')
const { NotFoundError, BadRequestError } = require('../core/errorResponse')
const {updateInventoryByProduct} = require('../repositories/inventoryRepository')
const moment = require('moment-timezone');
const { console } = require('inspector')
const {listOrderCancelledOfUser, listOrderCompletedOfUser, listOrderPendingOfUser, listOrderSuccessOfUser
    ,updateStatusCancelled, updateStatusCompleted, listOrderPending, listOrderSuccess, listOrderCancelled, listOrderCompleted
} = require('../repositories/orderRepository')
class OrderService {
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
    static convertTimeToVN(secondsToAdd) {
        // Lấy thời gian hiện tại theo múi giờ Việt Nam
        const currentTime = moment.tz("Asia/Ho_Chi_Minh");
        
        // Tính thời gian giao hàng ước tính bằng cách thêm số giây
        const estimateDeliveryTime = currentTime.clone().add(secondsToAdd, 'seconds');
    
        // Chuyển đổi thời gian hiện tại và thời gian ước tính giao hàng sang chuỗi ISO
        return {
            deliveryTime: estimateDeliveryTime.toISOString(), // Lưu theo UTC
            timeOrder: currentTime.toISOString() // Lưu theo UTC
        }
    }
    
    static async checkOutReview({ user, discount_code = null, product_ids = [] }) {
        if (!user) throw new NotFoundError('missing user data');
        const cart = await cartModel.findOne({ cart_userId: user._id });
        if (!cart) throw new NotFoundError('not found cart by user');

        const products = await productModel.find({ _id: { $in: product_ids }, isDelete: false, isPublished: true, isDraft: false });
        if (products.length !== product_ids.length) throw new NotFoundError('some products not found');

        const checkDiscount = await discountModel.findOne({ discount_code }).lean();
        const inventories = await inventoryModel.find({ inven_productId: { $in: products.map(p => p._id) } });
        let totalAmount = 0;
        let totalDiscount = 0;
        let totalPreparationTime = 0;
        const productCheckout = [];

        for (const product of products) {
            const productInCart = cart.cart_products.find(item => item.productId.toString() === product._id.toString());
            if (!productInCart) throw new NotFoundError('not found product in cart');

            const inventory = inventories.find(inv => inv.inven_productId.toString() === product._id.toString());
            if (!inventory || productInCart.quantity > inventory.inven_stock) {
                throw new BadRequestError('quantity order product exceed stock');
            }
            const quantity = productInCart.quantity;
            const price = product.product_price;
            const totalPrice = quantity * price;
            const totalTimePre = quantity * product.preparation_time;

            let totalDiscountFor = 0;
            if (!checkDiscount) {
                totalDiscountFor = 0;
            } else {
                totalDiscountFor = await calculateDiscount({ product, checkDiscount, user, totalPrice });
            }
            let  totalDiscountForProduct = 0
            if(checkDiscount.applicable_to === 'product'){
                totalDiscountForProduct = totalDiscountFor
            }
            totalPreparationTime += totalTimePre;
            totalAmount += totalPrice;
            totalDiscount += totalDiscountFor;

            productCheckout.push({
                productId: product._id,
                quantity,
                price,
                total_price: totalPrice,
                total_discount: totalDiscountForProduct,
            });
        }

        const finalPrice = totalAmount - totalDiscount;
        const convertSecondsToMinutes = totalPreparationTime / 60;
        const { deliveryTime, timeOrder } = this.convertTimeToVN(totalPreparationTime);

        return {
            order_userId: user._id,
            order_checkout: {
                totalAmount,
                totalDiscount,
                final_price: finalPrice,
                preparation_time: convertSecondsToMinutes,
                order_time: timeOrder,
                estimated_delivery_time: deliveryTime
            },
            order_product: productCheckout
        };
    }

    static async checkOutByUser({ user, product_ids = [], payment_method = 'online_payment', discount_code = null, advance_time = null }) {
        if (!user) throw new NotFoundError('missing user data');
        const cart = await cartModel.findOne({ cart_userId: user._id });
        if (!cart) throw new NotFoundError('not found cart by user');

        const { order_checkout, order_product } = await OrderService.checkOutReview({ user, product_ids, discount_code });
        const newOrder = await orderModel.create({
            order_userId: user._id,
            order_time: order_checkout.order_time, // Nếu đã là Date
            estimated_delivery_time: order_checkout.estimated_delivery_time, // Nếu đã là Date
            order_payment: { payment_method },
            order_product,
            order_status: 'pending',
            order_discount_code: discount_code,
            order_checkout: {
                totalAmount: order_checkout.totalAmount,
                totalDiscount: order_checkout.totalDiscount,
                final_price: order_checkout.final_price
            }
        })
        if (!newOrder) throw new BadRequestError('order creation failed');
        return {
            order: newOrder
        }
    }

}

module.exports = OrderService
