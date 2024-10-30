const {Schema, model, Types} = require('mongoose')
const DOCUMENT_NAME = 'Shipping'
const COLLECTION_NAME = 'Shippings'
const shippingSchema = new Schema({
    shipping_name:{
        type: String,
        enum:['delivery', 'pickup'],
        required: true
    },
    shipping_price:{
        type: Number,
        required: true
    }
},{
    timestamps: true,
    collection: COLLECTION_NAME
})

module.exports = model(DOCUMENT_NAME, shippingSchema)
