const {model, Schema} = require('mongoose')
const DOCUMENT_NAME = 'Location'
const COLLECTION_NAME = 'Locations'
const locationShema = new Schema({
    location_name: {
        type: String,
        required: true,
    },
    location_image: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    googleMapsLink: {
        type: String,
        default: '' 
    },
    description:{
        type: String,
        default: ''
    },
    Latitude_x:{
        type: String,
        default: '',
    },
    Longitude_y:{
        type: String,
        default: '',
    }
},{
    timestamps: true,
    collection: COLLECTION_NAME
})
module.exports = model(DOCUMENT_NAME, locationShema)