const { model, Schema } = require('mongoose');
const { convertToVietnamTime } = require('../utils/convertTime');
const DOCUMENT_NAME = 'Order';
const COLLECTION_NAME = 'Orders';

const checkOutSchema = new Schema({
    totalAmount: {
        type: Number,
        default: 0,
        required: true
    },
    totalDiscount: {
        type: Number,
        default: 0,
    },
    final_price: {
        type: Number,
        default: 0
    },
    shipping_id:{
        type: Schema.Types.ObjectId,
        ref: 'Shipping',
        required: true
    }
}, {
    _id: false
})
const paymentSchema = new Schema({
    payment_method: {
        type: String,
        enum: ['cash_payment', 'online_payment'],
        required: true,
        default: 'online_payment'
    },
    payment_status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'success'],
        default: 'pending'
    }
}, { _id: false });

const orderSchema = new Schema({
    order_userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    order_checkout: {
        type: checkOutSchema,
        required: true
    },
    order_payment: {
        type: paymentSchema,
        required: true
    },
    order_product: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
    }],
    order_trackingNumber: {
        type: String,
        default: () => `#${Math.floor(1000000000 + Math.random() * 9000000000)}`
    },
    order_status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'success'],
        default: 'pending'
    },
    order_time: {
        type: Date,
        required: true
    },
    selected_delivery_time: {  
        type: Boolean,
        required: true,
        default: false // false for "as soon as possible"
    },
    delivery_time: {  
        type: Date,
        default: null,
        validate: {
            validator: function(value) {
                // Only allow `delivery_time` if `selected_delivery_time` is true
                return this.selected_delivery_time ? value != null : true;
            },
            message: 'A delivery time is required if a specific delivery time is selected.'
        }
    },
    estimated_delivery_time: {
        type: Date,  // Thời gian giao hàng dự kiến =  order_time + thời gian làm món + thời gian đặt trước nếu có , sau đó sẽ đưa vô hàng đợi và tính toán lại
        required: true
    },
    order_discount_code:{
        type: String,
        default: null
    },
    note:{
        type: String,
        default: null
    }
},{
    timestamps: true,
    collection: COLLECTION_NAME
});

module.exports = model(DOCUMENT_NAME, orderSchema)
