const { model, Schema } = require("mongoose");
const moment = require("moment-timezone");

const DOCUMENT_NAME = "Order";
const COLLECTION_NAME = "Orders";

const ExtraSchema = new Schema({
  sideDish_id: {
    type: Schema.Types.ObjectId,
    ref: "sideDish",
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
  },
});

const checkOutSchema = new Schema(
  {
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
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const paymentSchema = new Schema(
  {
    payment_method: {
      type: String,
      enum: ["cash_payment", "online_payment"],
      required: true,
      default: "online_payment",
    },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "success"],
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
    },
    order_checkout: {
      type: checkOutSchema,
      required: true,
    },
    order_payment: {
      type: paymentSchema,
      required: true,
    },
    order_product: [
      {
        _id: false,
        product_id: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
        product_thumb: {
          type: String,
          required: true,
        },
        product_name: {
          type: String,
          required: true,
        },
        extra: [ExtraSchema],
      },
    ],
    order_trackingNumber: {
      type: String,
      default: () => `#${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    },
    order_status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "success"],
      default: "pending",
    },
    order_time: {
      type: String, // Thay vì Date, sử dụng String để lưu chuỗi ISO
      required: true,
    },
    options_delivery: {
      type: String,
      enum: ["asap", "specific_time"],
      default: "asap",
    },
    estimated_delivery_time: {
      type: String, // Thay vì Date, sử dụng String để lưu chuỗi ISO
      required: true,
    },
    order_discount_code: {
      type: String,
      default: null,
    },
    note: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

module.exports = model(DOCUMENT_NAME, orderSchema);
