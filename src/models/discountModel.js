const { Schema, model } = require("mongoose");
const DOCUMENT_NAME = "Discount";
const COLLECTION_NAME = "Discounts";
const discountUsedByUsersSchema = new Schema(
  {
    dbu_userId: {
      type: Schema.Types.ObjectId,
    },
    count_used: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);
const discountSchema = new Schema(
  {
    discount_name: { type: String, required: true }, // Tên chương trình giảm giá
    discount_image: { type: String, required: true },
    discount_code: { type: String, required: true }, // Mã giảm giá
    discount_start_date: { type: Date, required: true }, // Thời gian bắt đầu sử dụng mã
    discount_end_date: { type: Date, required: true }, // Thời gian kết thúc mã
    discount_value_type: {
      type: String,
      required: true,
      enum: ["percentage", "fixed_amount"],
    }, // Loại giảm giá (theo số tiền hoặc phần trăm)
    discount_value: { type: Number, required: true }, // Giá trị giảm giá
    min_order_value: { type: Number, required: false }, // Giá trị đơn hàng tối thiểu
    maximum_discount_value: { type: Number, required: true },
    max_total_uses: { type: Number, required: true }, // Tổng lượt sử dụng tối đa
    max_uses_per_user: { type: Number, required: true, default: 1 }, // Lượt sử dụng tối đa của mỗi người
    is_deleted: { type: Boolean, default: false },
    applicable_products: [{ type: Schema.Types.ObjectId, ref: "Product" }], // Các sản phẩm được áp dụng
    applicable_to: { type: String, required: true, enum: ["product", "order"] }, // áp dụng cho tổng giá order hay các sản phẩm riêng biệt trong order
    discount_user_used: { type: [discountUsedByUsersSchema], default: [] }, // ai đã sử dụng mã này
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);
discountSchema.pre("save", function (next) {
  if (this.discount_code) {
    // Loại bỏ khoảng trắng trong discount_code
    this.discount_code = this.discount_code.replace(/\s+/g, "");
  }
  next();
});
module.exports = model(DOCUMENT_NAME, discountSchema);
