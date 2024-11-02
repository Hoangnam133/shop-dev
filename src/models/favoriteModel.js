const { Schema, model } = require('mongoose')
const COLLECTION_NAME = 'Favorites'
const DOCUMENT_NAME = 'Favorite'
/// khó
const favoriteSchema = new Schema({
    user_id:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product_id: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})
favoriteSchema.index({ user: 1, product: 1 }, { unique: true })

module.exports = model(DOCUMENT_NAME, favoriteSchema);
