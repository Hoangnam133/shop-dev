const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const COLLECTION_NAME = 'RewardSettings';
const DOCUMENT_NAME = 'RewardSetting';

const rewardSettingSchema = new Schema({
    name:{
        type: String,
        required: true,
        unique: true,
    },
    pointRate: {
        type: Number,
        default: 0.01, // Tỷ lệ quy đổi, ví dụ 0.01 tương đương 1% của giá trị mua hàng
        min: [0, 'Point rate cannot be negative'],
    },
    isActive: {
        type: Boolean,
        default: true, // Để dễ dàng bật/tắt hệ thống tích điểm
    },
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

module.exports = model(DOCUMENT_NAME, rewardSettingSchema);
