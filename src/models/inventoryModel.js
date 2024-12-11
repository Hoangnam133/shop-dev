const { Schema, model } = require("mongoose");

const COLLECTION_NAME = "Inventories";
const DOCUMENT_NAME = "Inventory";

const inventorySchema = new Schema(
  {
    product_id:{
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    inven_stock:{
      type: Number,
      required: true,
      min: [0, "Số lượng tồn kho không thể âm"],
    },
    shop_id:{
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    minStockLevel:{
      type: Number,
      required: true,
      min: [0, "Mức tồn kho tối thiểu không thể âm"],
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

// Tạo chỉ mục duy nhất cho sự kết hợp giữa `inven_productId` và `shop_id`
inventorySchema.index({ product_id: 1, shop_id: 1 }, { unique: true });

module.exports = model(DOCUMENT_NAME, inventorySchema);
