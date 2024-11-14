const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const {
    calculateDiscount,
    updateUserToDiscount,
} = require('../repositories/discountRepository');
const productModel = require('../models/productModel');
const discountModel = require('../models/discountModel');
const inventoryModel = require('../models/inventoryModel');
const cartService = require('../services/cartService');
const { convertTimeToVN } = require('../utils/convertTime');
const { processMoMoPayment } = require('../momo/paymentService');
const { NotFoundError, BadRequestError } = require('../core/errorResponse');
const {
    updateInventoryByProduct,
} = require('../repositories/inventoryRepository');
const { console } = require('inspector');
const {
    listOrderCancelledOfUser,
    listOrderCompletedOfUser,
    listOrderPendingOfUser,
    listOrderSuccessOfUser,
    updateStatusCancelled,
    updateStatusCompleted,
    listOrderPending,
    listOrderSuccess,
    listOrderCancelled,
    listOrderCompleted,
} = require('../repositories/orderRepository');
class OrderService {
    static async listOrderCancelledOfUser(user) {
        return await listOrderCancelledOfUser(user);
    }
    static async listOrderCompletedOfUser(user) {
        return await listOrderCompletedOfUser(user);
    }
    static async list_OrderPendingOfUser(user) {
        return await listOrderPendingOfUser(user);
    }
    static async listOrderSuccessOfUser(user) {
        return await listOrderSuccessOfUser(user);
    }
    static async updateStatusCancelled(order_id) {
        return await updateStatusCancelled(order_id);
    }
    static async updateStatusCompleted(order_id) {
        return await updateStatusCompleted(order_id);
    }
    static async listOrderPending({ limit = 10, page = 1 }) {
        return await listOrderPending({ limit, page });
    }
    static async listOrderSuccess({ limit = 10, page = 1 }) {
        return await listOrderSuccess({ limit, page });
    }
    static async listOrderCancelled({ limit = 10, page = 1 }) {
        return await listOrderCancelled({ limit, page });
    }
    static async listOrderCompleted({ limit = 10, page = 1 }) {
        return await listOrderCompleted({ limit, page });
    }
    static async checkOutReview({
        user,
        discount_code = null,
        product_ids = [],
    }) {
        console.log(product_ids, 'Đây là 2 cái id');
        if (!user) throw new NotFoundError('missing user data');
        const cart = await cartModel.findOne({ cart_userId: user._id });
        if (!cart) throw new NotFoundError('not found cart by user');

        const products = await productModel.find({
            _id: { $in: product_ids },
            isDelete: false,
            isPublished: true,
            isDraft: false,
        });
        if (products.length !== product_ids.length)
            throw new NotFoundError('some products not found');
        // mai sửa tiếp gọi checkDiscountCode for discountRepsitoies

        const checkDiscount = await discountModel
            .findOne({
                discount_code,
            })
            .lean();
        const inventories = await inventoryModel.find({
            inven_productId: { $in: products.map((p) => p._id) },
        });
        let totalAmount = 0;
        let totalDiscount = 0;
        let totalPreparationTime = 0;
        const productCheckout = [];

        for (const product of products) {
            const productInCart = cart.cart_products.find(
                (item) => item.productId.toString() === product._id.toString()
            );
            if (!productInCart)
                throw new NotFoundError('not found product in cart');

            const inventory = inventories.find(
                (inv) =>
                    inv.inven_productId.toString() === product._id.toString()
            );
            if (!inventory || productInCart.quantity > inventory.inven_stock) {
                throw new BadRequestError(
                    'quantity order product exceed stock'
                );
            }

            const quantity = productInCart.quantity;
            const price = product.product_price;
            const totalPrice = quantity * price;
            const totalTimePre = quantity * product.preparation_time;

            let totalDiscountForProduct = 0;
            if (!checkDiscount) {
                totalDiscountForProduct = 0;
            }
            totalDiscountForProduct = await calculateDiscount({
                product,
                checkDiscount,
                user,
                totalPrice,
            });

            totalPreparationTime += totalTimePre;
            totalAmount += totalPrice;
            totalDiscount += totalDiscountForProduct;

            productCheckout.push({
                productId: product._id,
                quantity,
                price,
                total_price: totalPrice,
                total_discount: totalDiscountForProduct,
                product_thumb: product.product_thumb,
            });
        }

        const finalPrice = totalAmount - totalDiscount;
        const convertSecondsToMinutes = totalPreparationTime / 60;
        const { deliveryTime, timeOrder } =
            convertTimeToVN(totalPreparationTime);

        return {
            order_userId: user._id,
            order_checkout: {
                totalAmount,
                totalDiscount,
                final_price: finalPrice,
                preparation_time: convertSecondsToMinutes,
                timeOrder,
                deliveryTime,
            },
            order_product: productCheckout,
        };
    }

    static async checkOutByUser({
        user,
        product_ids = [],
        payment_method = 'online_payment',
        discount_code = null,
    }) {
        if (!user) throw new NotFoundError('missing user data');
        const cart = await cartModel.findOne({ cart_userId: user._id });
        if (!cart) throw new NotFoundError('not found cart by user');
        const { order_checkout, order_product } =
            await OrderService.checkOutReview({
                user,
                product_ids,
                discount_code,
            });
        console.log(order_checkout, order_product);
        const newOrder = await orderModel.create({
            order_userId: user._id,
            order_checkout,
            order_payment: { payment_method },
            order_product,
            order_status: 'pending',
            order_discount_code: discount_code,
        });
        if (!newOrder) throw new BadRequestError('order creation failed');
        const paymentUrl = await processMoMoPayment({
            orderId: newOrder._id,
            totalPrice: order_checkout.final_price,
        });
        if (!paymentUrl || paymentUrl === null) {
            await orderModel.findByIdAndDelete(newOrder._id);
            throw new BadRequestError('payment initialization failed');
        }

        return {
            order: newOrder,
            paymentUrl,
        };
    }
    // xử lý thêm discount nếu như thanh toán thành công thì thêm người dùng là đếm số lượt sử dụng vào
    // xem xét thêm việc có lưu mã giảm giá vào đơn hàng luôn không
    // thiếu lịch sử đơn hàng (đơn hàng đã hủy, đơn hàng đã thanh toán)
    // thêm xử lý thêm trường hợp đơn hàng đã hủy, đơn hàng đã thanh toán (thông báo người dùng)
    // thêm hủy đơn hàng, ví dụ hủy trong vòng 5-10p...
    // xuất mã giảm giá (tương ứng với từng sản phẩm trong đơn hàng ...)
    // socket io gởi thông báo tự động thời gian thực

    static async handlePaymentCallback({ orderId, message, errorCode }) {
        const order = await orderModel.findOne({
            _id: orderId,
            order_status: 'pending',
        });
        if (!order) throw new NotFoundError('Order not found');
        console.log(`EWRWERWERWRWERWE ${order.order_userId}`);

        // kiểm tra trạng thái đơn hàng và trả về true nếu đã thanh toán thành công
        if (message === 'Success' || errorCode === 0) {
            order.order_payment.payment_status = 'success';
            order.order_status = 'completed';

            for (const { productId, quantity } of order.order_product) {
                await updateInventoryByProduct({ productId, quantity });
            }
            await order.save();
            const productIds = order.order_product.map(
                (item) => item.productId
            );
            for (const productId of productIds) {
                await cartService.deleteProductCart({
                    user: order.order_userId,
                    product: { productId },
                });
            }
            await updateUserToDiscount({
                discountCode: order.order_discount_code,
                user_id: order.order_userId,
            });
            return true;
        }
        if (message === 'Bad request' || errorCode !== 0) {
            await orderModel.findByIdAndDelete(order._id);
            console.log('Đã xóa');
            return false;
        }
    }
}

module.exports = OrderService;
