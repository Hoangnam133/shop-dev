// models/shopSchema.js
const { Schema, model, default: mongoose } = require("mongoose");

const COLLECTION_NAME = "Shops";
const DOCUMENT_NAME = "Shop";

const shopSchema = new Schema(
  {
    shop_name: {
      type: String,
      required: true,
    },
    location_id: {
      type: Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    shop_image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    opening_hours:{
      type: mongoose.Types.ObjectId,
      ref: "OpeningHours",
      //required: true
    }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

module.exports = model(DOCUMENT_NAME, shopSchema)
