const { model, Schema } = require('mongoose');
const { convertToVietnamTime } = require('../utils/convertTime');
const moment = require('moment-timezone')
const DOCUMENT_NAME = 'Order';
const COLLECTION_NAME = 'Orders';
const ExtraSchema = new Schema({
    sideDish_id: {
        type: Schema.Types.ObjectId,
        ref: 'sideDish',  
        required: true,
    },
    sideDish_name: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
    }
})
const checkOutSchema = new Schema({
    totalAmount: {
      type: Number,
      default: 0,
      required: true,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
    finalPrice: {
        type: Number,
        default: 0
    }
}, {
    _id: false
})
const paymentSchema = new Schema({
    payment_method: {
      type: String,
      enum: ["cash_payment", "online_payment"],
      required: true,
      default: "online_payment",
    },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "Success"],
      default: "pending",
    },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    order_userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    order_checkout: {
      type: checkOutSchema,
      required: true,
    },
    order_payment: {
      type: paymentSchema,
      required: true,
    },
    order_product: [{
        _id: false,
        product_id: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        // price:{
        //     type: Number,
        //     required: true
        // },
        totalPrice: {
            type: Number,
            required: true
        },
        product_thumb:{
            type: String,
            required: true
        },
        product_name:{
            type: String,
            required: true
        },
        extra: [ExtraSchema]
    }],
    order_trackingNumber: {
      type: String,
      default: () => `#${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
    },
    dineOption: {
      type: String,
      enum: ['takeaway', 'dine_in'],
      default: 'dine_in', 
      required: true,
    },
    order_status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "success"],
      default: "pending",
      index: true,
    },
    order_time: {
      type: String, // Thay vì Date, sử dụng String để lưu chuỗi ISO
      required: true,
    },
    options_delivery:{
        type: String,
        enum: ['asap', 'specific_time'],
        default: 'asap'
    },
    estimated_delivery_time: {
      type: String, // Thay vì Date, sử dụng String để lưu chuỗi ISO
      required: true,
    },
    order_cancellation_cutoff: {
      type: String,
      default: null
    },
    order_discount_code: {
      type: String,
      default: null,
    },
    order_shopId:{
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    note: {
      type: String,
      default: null,
    },
    isRefunded:{
      type: Boolean,
      default: false,
    },
    transId:{
      type: String,
      default: null,
    }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);
orderSchema.pre('save', function (next) {
  if (this.estimated_delivery_time) {
      const estimatedTime = moment.tz(this.estimated_delivery_time, 'Asia/Ho_Chi_Minh');  // Chuyển về giờ Việt Nam
      const cancellationCutoff = estimatedTime.subtract(15, 'minutes');  // Trừ 15 phút
      this.order_cancellation_cutoff = cancellationCutoff.format('YYYY-MM-DDTHH:mm:ss');  // Lưu theo định dạng mà không chuyển sang UTC
  }
  next();
})
orderSchema.index({ order_userId: 1 });
orderSchema.index({ order_status: 1 }); 
orderSchema.index({ createdAt: -1 }); 
orderSchema.index({ estimated_delivery_time: 1 }); 
orderSchema.index({ 'order_product.product_id': 1 }); 

module.exports = model(DOCUMENT_NAME, orderSchema);
