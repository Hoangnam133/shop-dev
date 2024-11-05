const {model, Schema} = require('mongoose')
const DOCUMENT_NAME = 'Category'
const COLLECTION_NAME = 'Categories'
const categoryShema = new Schema({
    category_name:{
        type: String,
        required: true,
    },
    isPublished:{
        type: Boolean,
        default: true
    },
    isDeleted:{
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