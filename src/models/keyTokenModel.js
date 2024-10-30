const {Schema, model} = require('mongoose') // Erase if already required
const DOCUMENT_NAME = 'Key'
const COLLECTION_NAME = 'Keys'
var keyTokenSchema = new Schema({
    user:{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    publicKey:{
        type:String,
        required:true,
        trim: true
    },
    privateKey:{
        type: String,
        required: true,
        trim: true
    },
    refreshTokensUsed:{
        type: Array,
        default:[]
    },
    refreshToken:{
        type: String,
        required: true
    }
},{
    timestamps: true,
    collection: COLLECTION_NAME
})
module.exports = model(DOCUMENT_NAME, keyTokenSchema)