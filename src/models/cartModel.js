const { Schema, model } = require("mongoose");

const cartProductSchema = new Schema(
  {
    product_id: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
    },  
    isDeleted:{
      type: Boolean,
      default: false,
    },
    sideDishes:[
      {
        sideDish_id: {
          type: Schema.Types.ObjectId,
          ref: "SideDish",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        sideDish_name:{
          type: String,
          required: true,
        }
      },
    ],
    uniqueKey: {
      type: String
    },
  },
  {
    _id: false,
  }
);
cartProductSchema.pre("save", function (next) {
  this.sideDishes = this.sideDishes.sort((a, b) => {
      return a.sideDish_id.toString().localeCompare(b.sideDish_id.toString());
  });
  const sideDishIds = this.sideDishes.map(dish => dish.sideDish_id).join("-");
  this.uniqueKey = sideDishIds ? `${this.product_id}-${sideDishIds}` : `${this.product_id}`;
  next();
});

const cartSchema = new Schema(
  {
    cart_status: {
      type: String,
      required: true,
      enum: ["active", "unactive", "failed", "pending"],
      default: "active",
    },
    cart_products: {
      type: [cartProductSchema],
      default: [],
      required: true,
    },
    cart_userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "Carts",
  }
);
module.exports = model("Cart", cartSchema);
