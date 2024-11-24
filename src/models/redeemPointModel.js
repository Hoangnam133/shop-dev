const { model, Schema } = require('mongoose')
const moment = require('moment-timezone')


const DOCUMENT_NAME = 'RedeemPoint'
const COLLECTION_NAME = 'RedeemPoints'

const redeemPointSchema = new Schema(
{
    user_id: {
      type: Schema.Types.ObjectId, 
      required: true,
      ref: 'User', 
    },
    redeem_code: {
      type: String, 
      required: true,
      unique: true,
    },
    redeem_points: {
        type: Number, 
        required: true,
    },
    redeem_content: {
        type: String, // Nội dung đổi điểm (mô tả sản phẩm sản phẩm đổi tên gì)
        required: true,
        trim: true,
    },
    redeem_time: {
      type: String
    },
    expiry_date: {
      type: String
    },
    isExpired: {  // Trạng thái hết hạn (true là hết hạn, false là còn hạn)
        type: Boolean,
        default: false,
    },
    status: {
      type: Boolean,
      required: true,
      default: false, // đã đổi hoặc chưa đổi true là đã đổi, và ngược lại
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME, 
  }
)


redeemPointSchema.pre('save', function (next) {
  const now = moment.tz('Asia/Ho_Chi_Minh')
  this.redeem_time = now.format('YYYY-MM-DDTHH:mm:ss')
  this.expiry_date = now.add(3, 'days').format('YYYY-MM-DDTHH:mm:ss')
  next()
})
module.exports = model(DOCUMENT_NAME, redeemPointSchema)
