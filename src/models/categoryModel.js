const {model, Schema} = require('mongoose')
const DOCUMENT_NAME = 'Category'
const COLLECTION_NAME = 'Categories'
const categoryShema = new Schema({
    meals:{
        type: String,
        required: true,
    },
    draft:{
        type: Boolean,
        default: true
    },
    isDelete:{
        type: Boolean,
        default: false
    },
    category_images:{
        type: String,
        required: true
    }
},{
    timestamps: true,
    collection: COLLECTION_NAME
})
module.exports = model(DOCUMENT_NAME, categoryShema)