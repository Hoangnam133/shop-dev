const _ = require('lodash')
const mongoose = require('mongoose')

const toObjectId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Invalid ObjectId format');
    }
    return new mongoose.Types.ObjectId(id); // Trả về ObjectId
}

const convertIoToObjectId = (id)=>{
    return mongoose.Types.ObjectId(id)
}
const getInfoData = ({fileds = [], object = {}})=>{
    return _.pick(object,fileds)
}
const getSelectData = (select = []) =>{
    return Object.fromEntries(select.map(el => [el, 1]))
}
const unGetSelectData = (data, select = []) => {
    return Object.fromEntries(
        Object.entries(data).filter(([key]) => !select.includes(key))
    )
}
const unGetSelectListData = (data, select = []) => {
    return Object.fromEntries(
        Object.entries(data).filter(([key]) => !select.includes(key))
    )
}
const getSelectListData = (data, select = []) => {
    return Object.fromEntries(
        Object.entries(data).filter(([key]) => select.includes(key))
    )
}

// const removeUndefinedObject = obj =>{
//     Object.keys(obj).forEach(k =>{
//         if(obj[k] == null){
//             delete  obj[k]
//         }
//     })
//     return obj
// }
const removeUndefinedObject = (obj) => {
    if (!obj || typeof obj !== 'object') {
        return {}; // Trả về đối tượng rỗng nếu obj là null hoặc undefined
    }
    return Object.keys(obj).reduce((acc, key) => {
        if (obj[key] !== undefined) {
            acc[key] = obj[key]
        }
        return acc;
    }, {})
}
const updateNestedObjectParser = obj =>{
    const final = {}
    Object.keys(obj).forEach(k =>{
        if(typeof obj[k] === 'object' && !Array.isArray(obj[k])){
            const response = updateNestedObjectParser(obj[k])
            Object.keys(response).forEach(a =>{
                final[`${k}.${a}`] = response[a]
            })
        }
        else{
            final[k] = obj[k]
        }
    })
    return final
}
const isDuplicateNameOnCreate = async ({model, fieldName, name}) => {
    const sanitizedInputName = name.replace(/\s+/g, '') // Loại bỏ dấu cách trong tên nhập vào
    const query = {
        [fieldName]: { $regex: new RegExp(`^${sanitizedInputName}$`, 'i') }
    };

    // Tìm kiếm sản phẩm có tên trùng khớp (không phân biệt hoa thường và bỏ qua dấu cách)
    const existingRecords = await model.find().lean()
    const isDuplicate = existingRecords.some(record => {
        const sanitizedRecordName = record[fieldName].replace(/\s+/g, '') // Loại bỏ dấu cách trong tên lưu trữ
        return sanitizedRecordName.toLowerCase() === sanitizedInputName.toLowerCase()
    });

    return isDuplicate;
}
const isDuplicateUpdateField = async ({ model, fieldName, value, excludeId }) => {
    // Loại bỏ khoảng trắng và chuyển về chữ thường trong giá trị cần kiểm tra
    const sanitizedValue = value.replace(/\s+/g, '').toLowerCase()

    // Lấy tất cả các bản ghi để duyệt và so sánh theo tiêu chí loại bỏ khoảng trắng, không phân biệt hoa thường
    const records = await model.find(excludeId ? { _id: { $ne: excludeId } } : {}).lean()

    // Kiểm tra từng bản ghi xem có trùng với giá trị đã làm sạch hay không
    const isDuplicate = records.some(record => {
        const sanitizedRecordValue = record[fieldName].replace(/\s+/g, '').toLowerCase()
        return sanitizedRecordValue === sanitizedValue
    })

    return isDuplicate; // Trả về true nếu có trùng lặp
}
module.exports = {
    getInfoData,
    getSelectData,
    unGetSelectData,
    removeUndefinedObject,
    updateNestedObjectParser,
    convertIoToObjectId,
    unGetSelectListData,
    getSelectListData,
    toObjectId,
    isDuplicateNameOnCreate,
    isDuplicateUpdateField
}