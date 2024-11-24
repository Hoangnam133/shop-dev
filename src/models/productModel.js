const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const dotenv = require("dotenv");
const slugify = require("slugify");
dotenv.config();
const { Schema, model } = mongoose;
const COLLECTION_NAME = "Products";
const DOCUMENT_NAME = "Product";
const productSchema = new Schema(
  {
    product_name: {
      type: String,
      required: true,
    },
    product_thumb: {
      type: String,
      required: true,
    },
    product_description: {
      type: String,
      required: true,
    },
    ingredients: {
      type: String,
      required: true,
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    product_slug: {
      type: String,
      unique: true,
    },
    product_ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    review_count: {
      type: Number,
      default: 0
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    preparation_time: {
      type: Number,
      required: true,
    },
    product_usage: {
      type: String,
      required: true,
    },
    product_price: {
      type: Number,
      required: true,
    },
    required_points: {
      type: Number,
      default: 0, // Nếu là 0, sản phẩm không yêu cầu điểm để đổi
      min: [0, "Required points cannot be negative"],
    },
    sideDish_id: [
      {
        type: Schema.Types.ObjectId,
        ref: "SideDish",
      },
    ],
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

// Tạo slug cho sản phẩm trước khi lưu
productSchema.pre("save", function (next) {
  this.product_slug = slugify(this.product_name, { lower: true });
  this.required_points = Math.floor(this.product_price * 0.1);
  next();
});

// Tạo chỉ mục cho các trường cần tìm kiếm
productSchema.index({ product_name: "text", product_description: "text" });

// Kích hoạt phân trang cho mô hình
productSchema.plugin(mongoosePaginate);

module.exports = model(DOCUMENT_NAME, productSchema);
