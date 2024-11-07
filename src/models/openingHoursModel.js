const { Schema, model } = require('mongoose');

// const hoursSchema = new Schema({
//     isClosed: { type: Boolean, default: false },
//     open: { type: String, required: true },  // Định dạng: 'HH:mm', ví dụ: '09:00'
//     close: { type: String, required: true }, // Định dạng: 'HH:mm', ví dụ: '17:00'
// });
const hoursSchema = new Schema({
    isClosed: { 
        type: Boolean, 
        default: false // Mặc định là không đóng cửa
    },
    open: { 
        type: String, 
        required: function() { 
            return !this.isClosed; // Nếu isClosed là true, không yêu cầu giá trị open
        },  
    },  // Định dạng: 'HH:mm', ví dụ: '09:00'
    close: { 
        type: String, 
        required: function() { 
            return !this.isClosed; // Nếu isClosed là true, không yêu cầu giá trị close
        },  
    }, // Định dạng: 'HH:mm', ví dụ: '17:00'
},{
    _id: false
});
const openingHoursSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    monday: hoursSchema,
    tuesday: hoursSchema,
    wednesday: hoursSchema,
    thursday: hoursSchema,
    friday: hoursSchema,
    saturday: hoursSchema,
    sunday: hoursSchema,
    isDeleted: {
        type: Boolean,
        default: false,
    }
    },
{
    timestamps: true,
    collection: 'OpeningHours',
});

module.exports = model('OpeningHours', openingHoursSchema);
