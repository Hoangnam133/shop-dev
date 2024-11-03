const { Schema, model } = require('mongoose');
const COLLECTION_NAME = 'shopProducts';
const DOCUMENT_NAME = 'shopProduct';
const shopProductSchema = new Schema({
    shop_id: {
        type: Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
    },
    product_id: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
    isDeleted:{
        type: Boolean,
        default: false,
    },
    sales_count:{
        type: Number,
        default: 0,
        min: [0, 'Sales count cannot be negative'],
    }
}, {
    timestamps: true,
    collection: 'ShopProducts',
})
shopProductSchema.index({ shop_id: 1, product_id: 1 }, { unique: true });

module.exports = model('ShopProduct', shopProductSchema);
