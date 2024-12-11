const { Schema, model } = require('mongoose')
const {convertToVietnamTime} = require('../utils/convertTime')
const COLLECTION_NAME = 'Reviews'
const DOCUMENT_NAME = 'Review'
const reviewSchema = new Schema({
    review_user_id:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    review_order_id: {
        type: Schema.Types.ObjectId,
        ref: 'Order'
    },
    review_rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
        default: 5
    },
    review_content: {
        type: String,
        required: true
    },
    review_day: {
        type: Date,
        default: () => convertToVietnamTime()
    },
    review_isDeleted:{
        type: Boolean,
        default: false
    }
},{
    timestamps: true,
    collection: COLLECTION_NAME,
})
module.exports = model(DOCUMENT_NAME, reviewSchema)
