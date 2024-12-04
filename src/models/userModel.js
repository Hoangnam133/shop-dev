const { Schema, model } = require("mongoose");
const COLLECTION_NAME = "Users";
const DOCUMENT_NAME = "User";
const roles = {
  ADMIN: "101",
  USER: "102",
  EMPLOYEE: "103",
  BRANCH_MANAGER: "104",
};
const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      maxLength: 150,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    verify: {
      type: Boolean,
      default: false,
    },
    roles: {
      type: String,
      enum: [roles.ADMIN, roles.USER, roles.EMPLOYEE, roles.BRANCH_MANAGER],
    },
    resetPasswordCode: {
      type: String,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    shop_id: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
    },
    points: {
      type: Number,
      default: 0,
    },
    deviceToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);
module.exports = model(DOCUMENT_NAME, userSchema);
