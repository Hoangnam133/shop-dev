const openingHoursModel = require('../models/openingHoursModel')
const {NotFoundError, BadRequestError} = require('../core/errorResponse')
const {isDuplicateNameOnCreate, toObjectId, removeUndefinedObject, isDuplicateUpdateField} = require('../utils/index')
const shopModel = require('../models/shopModel')
const { addDays, isWithinInterval, subHours  } = require('date-fns')
const moment = require('moment-timezone');
// tạo giờ mở và đóng cửa
const createOpeningHours = async(payload)=>{
    const {name} = payload
    const checkName = await isDuplicateNameOnCreate({model: openingHoursModel, fieldName: "name", name})
    if(checkName){
        throw new BadRequestError("Opening hours name already exists")
    }
    const newOpeningHours = await openingHoursModel.create(payload)
    if(!newOpeningHours){
        throw new BadRequestError("Failed to create opening hours")
    }
    return newOpeningHours
}

// lấy ra tất cả giờ mở và đóng cửa
const getAllOpeningHours = async({limit = 10, page = 1})=>{
    const skip = (page - 1) * limit
    const openingHours = await openingHoursModel.find({
        isDeleted: false
    })
        .skip(skip)
        .limit(limit)

    return openingHours
}
// chi tiết giờ mở và đóng
const getOpeningHoursById = async(openingHours_id)=>{
    const foundOpeningHours = await openingHoursModel.findById(toObjectId(openingHours_id))
    if(!foundOpeningHours){
        throw new NotFoundError("Opening hours not found")
    }
    return foundOpeningHours
}
// cập nhật
const updateOpenningHours = async({openingHours_id, payload})=>{
    const foundOpeningHours = await openingHoursModel.findById(toObjectId(openingHours_id))
    if(!foundOpeningHours){
        throw new NotFoundError("Opening hours not found")
    }
    const cleanData = removeUndefinedObject(payload)
    if(cleanData.name){
        const checkName = await isDuplicateUpdateField({model: openingHoursModel, fieldName: "name", excludeId: foundOpeningHours._id, value: cleanData.name})
        if(checkName){
            throw new BadRequestError("Opening hours name already exists")
        }
    }
    if(cleanData.isDeleted === true){
        await softDeleteOpenningHours(foundOpeningHours._id)
    }
    const updateOpeningHours = await openingHoursModel.findByIdAndUpdate(openingHours_id, cleanData, {new: true, lean: true})
    if(!updateOpeningHours){
        throw new BadRequestError("Failed to update opening hours")
    }
    return updateOpeningHours
}
// xóa mềm
const softDeleteOpenningHours = async(openingHours_id)=>{
    const foundOpeningHours = await openingHoursModel.findByIdAndUpdate(toObjectId(openingHours_id), {isDeleted: true}, {new: true, lean: true})
    if(!foundOpeningHours){
        throw new NotFoundError("Opening hours not found")
    }
    return foundOpeningHours
}
// lấy ra những giờ mở cửa đã bị xóa
const getDeletedOpeningHours = async()=>{
    const deletedOpeningHours = await openingHoursModel.find({isDeleted: true})
    if(!deletedOpeningHours){
        throw new NotFoundError("No deleted opening hours found")
    }
    return deletedOpeningHours
}
const restoreOpeningHours = async(openingHours_id)=>{
    const foundOpeningHours = await openingHoursModel.findByIdAndUpdate(toObjectId(openingHours_id), {isDeleted: false}, {new: true, lean: true})
    if(!foundOpeningHours){
        throw new NotFoundError("Opening hours not found")
    }
    return foundOpeningHours
}
const getAllOpeningHoursOfShopId = async(shop_id)=>{
    const foundShop = await shopModel.findById(toObjectId(shop_id))
    if(!foundShop){
        throw new NotFoundError("Shop not found")
    }
    const getOpenningHours = await openingHoursModel.find({
        _id: foundShop.opening_hours,
        isDeleted: false
    })
    if(!getOpenningHours){
        throw new NotFoundError("No opening hours found")
    }
    return getOpenningHours
}
// hàm này áp dụng cho đặt trước 
const checkDeliveryTimeForShop = async ({ shop_id, selectedDeliveryTime, totalMinutes }) => {
    // Lấy ra giờ mở cửa của shop dựa vào shop_id
    const foundShop = await shopModel.findById(shop_id);
    if (!foundShop) {
        return false;
    }

    const openingHours = await openingHoursModel.findById(foundShop.opening_hours);
    if (!openingHours || openingHours.isDeleted) {
        return false;
    }
    console.log(openingHours.saturday);

    // Kiểm tra tính hợp lệ của selectedDeliveryTime
    if (!selectedDeliveryTime) return true; // Nếu không có thời gian giao hàng mong muốn, coi là hợp lệ

    const selectedDate = new Date(selectedDeliveryTime);
    
    // Kiểm tra xem selectedDeliveryTime có phải là ngày hợp lệ không
    if (isNaN(selectedDate.getTime())) {
        return false;
    }

    // Cộng thời gian chuẩn bị vào selectedDeliveryTime
    selectedDate.setMinutes(selectedDate.getMinutes() + totalMinutes);

    const currentDate = new Date();
    // Đặt thời gian giờ, phút, giây, mili giây của ngày hiện tại thành 00:00:00 để so sánh ngày
    currentDate.setHours(0, 0, 0, 0);
    const maxPreorderDate = addDays(currentDate, 2);  // Giới hạn đặt trước là 2 ngày kể từ ngày hiện tại
    maxPreorderDate.setHours(23, 59, 59, 999);  // Đảm bảo maxPreorderDate là hết ngày 2 ngày sau

    // Kiểm tra nếu thời gian giao hàng vượt quá giới hạn 2 ngày hoặc là trước ngày hiện tại
    if (selectedDate > maxPreorderDate || selectedDate < currentDate) {
        return false;
    }

    // Kiểm tra nếu tháng hoặc năm không khớp với tháng và năm hiện tại
    if (selectedDate.getFullYear() !== currentDate.getFullYear()) {
        return false; // Năm không khớp
    }

    if (selectedDate.getMonth() !== currentDate.getMonth()) {
        return false; // Tháng không khớp
    }

    // Xác định ngày trong tuần và lấy giờ mở cửa tương ứng
    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayOfWeek = daysOfWeek[selectedDate.getDay()];
    const dayOpeningHours = openingHours[dayOfWeek];

    // Kiểm tra shop có mở cửa vào ngày đã chọn không
    if (!dayOpeningHours || dayOpeningHours.isClosed) {
        return false; // Nếu shop đóng vào ngày đó
    }

    // Lấy giờ mở và đóng cửa của shop trong ngày đã chọn
    const openingTime = new Date(selectedDate);
    openingTime.setHours(...dayOpeningHours.open.split(':').map(Number)); // Giờ mở cửa

    const closingTime = new Date(selectedDate);
    closingTime.setHours(...dayOpeningHours.close.split(':').map(Number)); // Giờ đóng cửa

    // Giới hạn thời gian đặt hàng là 1 tiếng trước giờ đóng cửa
    const lastValidOrderTime = subHours(closingTime, 1); // 1 tiếng trước giờ đóng cửa

    // Kiểm tra nếu thời gian đặt trước nằm ngoài giờ mở cửa hoặc quá giờ đóng cửa
    if (selectedDate < openingTime || selectedDate > lastValidOrderTime) {
        return false; // Nếu chọn thời gian ngoài giờ mở cửa
    }

    return true;
}
// này là áp dụng đặt lấy ngay nè
const checkImmediateDeliveryTime  = async ({shop_id, totalMinutes}) => {
    // Lấy giờ mở cửa của shop
    const foundShop = await shopModel.findById(shop_id);
    if (!foundShop) {
        throw new NotFoundError('Shop not found');
    }

    const openingHours = await openingHoursModel.findById(foundShop.opening_hours);
    if (!openingHours || openingHours.isDeleted) {
        throw new NotFoundError('Shop opening hours not found');
    }

    const currentTime = new Date();

    // Tính thời gian giao hàng mặc định (hiện tại cộng với totalMinutes cộng thêm 20 phút)
    let estimatedDelivery = new Date(currentTime.getTime() + totalMinutes * 60000 + 20 * 60000); // +20 phút

    // Lấy ngày và giờ của thời gian giao hàng
    const dayOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][estimatedDelivery.getDay()];
    const dayOpeningHours = openingHours[dayOfWeek];

    // Kiểm tra nếu cửa hàng không mở vào ngày đã chọn
    if (!dayOpeningHours || dayOpeningHours.isClosed) {
        throw new BadRequestError('Shop is closed on the selected day');
    }

    // Lấy giờ mở cửa và đóng cửa của cửa hàng trong ngày đã chọn
    const openingTime = new Date(estimatedDelivery);
    openingTime.setHours(...dayOpeningHours.open.split(':').map(Number)); // Giờ mở cửa

    const closingTime = new Date(estimatedDelivery);
    closingTime.setHours(...dayOpeningHours.close.split(':').map(Number)); // Giờ đóng cửa

    // Kiểm tra nếu thời gian giao hàng nằm trong khoảng giờ mở cửa và đóng cửa
    if (estimatedDelivery < openingTime || estimatedDelivery > closingTime) {
        return false
    }

    const vietnamTime = moment(estimatedDelivery).tz('Asia/Ho_Chi_Minh'); // Chuyển sang giờ Việt Nam

    // Định dạng lại thời gian theo chuẩn ISO 8601
    const formattedTime = vietnamTime.format('YYYY-MM-DDTHH:mm:ss');

    return formattedTime;
};
const getOpeningTimesForNextDays = async (shop) => {
    try {
        const timezone = 'Asia/Ho_Chi_Minh';
        const now = moment().tz(timezone); // Thời gian hiện tại
        const foundShop = await shopModel.findById(shop._id);
        if (!foundShop) {
            throw new NotFoundError('Shop not found');
        }
        const openingHours = await openingHoursModel.findById(foundShop.opening_hours);
        if (!openingHours || openingHours.isDeleted) {
            throw new NotFoundError('Shop opening hours not found');
        }

        // Tiêu đề các ngày
        const dayTitles = ['Today', 'Tomorrow', 'InTwoDays'];

        // Dữ liệu trả về
        const result = {};

        // Duyệt qua 3 ngày (Today, Tomorrow, The day after tomorrow)
        for (let daysToAdd = 0; daysToAdd < 3; daysToAdd++) {
            const targetDay = moment().tz(timezone).add(daysToAdd, 'day');
            const dayOfWeek = targetDay.format('dddd').toLowerCase(); // monday, tuesday,...
            const titleKey = dayTitles[daysToAdd]; // Lấy tiêu đề phù hợp: Today, Tomorrow,...

            const hours = openingHours[dayOfWeek];
            if (!hours || hours.isClosed) {
                continue; // Nếu ngày đóng cửa, bỏ qua ngày này
            }

            // Tính toán thời gian bắt đầu
            const dateKey = targetDay.format('YYYY-MM-DD');
            const openTime = moment.tz(`${dateKey}T${hours.open}`, timezone);
            let startTime = openTime;

            // Nếu là ngày hôm nay, bắt đầu từ thời gian hiện tại hoặc giờ mở cửa
            if (daysToAdd === 0) {
                const nowRounded = now.clone().add(30 - (now.minute() % 30), 'minutes').startOf('minute'); // Làm tròn đến nửa giờ kế tiếp
                startTime = nowRounded.isAfter(openTime) ? nowRounded : openTime;
            }

            const lastAvailableTime = moment
                .tz(`${dateKey}T${hours.close}`, timezone)
                .subtract(1, 'hour');

            const times = {};
            let currentTime = startTime;
            while (currentTime.isBefore(lastAvailableTime)) {
                const timeKey = currentTime.format('HH:mm'); // Key là giờ:phút
                times[timeKey] = currentTime.format('YYYY-MM-DDTHH:mm:ss'); // Value là thời gian đầy đủ
                currentTime = currentTime.add(30, 'minutes'); // Tăng 30 phút
            }

            if (Object.keys(times).length > 0) {
                result[titleKey] = times; // Chỉ lưu kết quả nếu có dữ liệu
            }
        }

        return result;
    } catch (error) {
        console.error(error);
        throw new BadRequestError('Error getting opening times');
    }
};

// ở đây
module.exports = {
    createOpeningHours,
    getAllOpeningHours,
    getOpeningHoursById,
    updateOpenningHours,
    softDeleteOpenningHours,
    getDeletedOpeningHours,
    getAllOpeningHoursOfShopId,
    restoreOpeningHours,
    checkDeliveryTimeForShop,
    checkImmediateDeliveryTime,
    getOpeningTimesForNextDays
}