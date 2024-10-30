const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const sideDishSchema = new Schema({
    name:{
        type: String,
        required: true, // Tên món phụ là bắt buộc
    },
    price: {
        type: Number,
        required: true, // Giá món phụ là bắt buộc
    },
    description: {
        type: String,
        default: '' // Mô tả món phụ (tuỳ chọn)
    },
    isAvailable: {
        type: Boolean,
        default: true, // Trạng thái có sẵn
    },
    sideDish_image: {
        type: String,
        required: true 
    }
}, {
    timestamps: true, // Tự động tạo timestamps (createdAt, updatedAt)
    collection: 'SideDishes', // Tên collection trong MongoDB
});

// Xuất mô hình SideDish
module.exports = model('SideDish', sideDishSchema);
