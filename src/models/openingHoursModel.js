// models/openingHoursSchema.js
const { Schema, model } = require('mongoose');
const openingHoursSchema = new Schema({
    monday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
    },
    tuesday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
    },
    wednesday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
    },
    thursday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
    },
    friday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
    },
    saturday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
    },
    sunday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
    },
    shop_id:{
        type: Schema.Types.ObjectId,
        ref: 'Shop'
    }
}, {
    timestamps: true,
    collection: 'OpeningHours'
});
// định dạng 'HH:mm' '09:00'
module.exports = model('OpeningHours', openingHoursSchema);
