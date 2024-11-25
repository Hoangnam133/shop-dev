const express = require('express');
const { authentication } = require('../../auth/authUtils'); 
const openingHoursController = require('../../controllers/openingHourController');
const { asynHandler } = require('../../utils/handler');

const router = express.Router();


// Các route cho giờ mở cửa
router.get('/getOpeningTimesForNextDays', authentication,asynHandler(openingHoursController.getOpeningTimesForNextDays)); 



router.post('/create', asynHandler(openingHoursController.createOpeningHours)); // Tạo giờ mở cửa (hoặc có thể là tạo mới)
router.get('/getAll', asynHandler(openingHoursController.getAllOpeningHours)); // Lấy tất cả giờ mở cửa
router.patch('/update/:openingHours_id', asynHandler(openingHoursController.updateOpeningHours)); // Cập nhật giờ mở cửa
router.get('/getById/:openingHours_id', asynHandler(openingHoursController.getOpeningHoursById)); // Lấy giờ mở cửa theo ID
router.delete('/delete/:openingHours_id', asynHandler(openingHoursController.softDeleteOpenningHours)); // Xóa mềm giờ mở cửa
router.get('/listdeleted', asynHandler(openingHoursController.getDeletedOpeningHours)); // Lấy giờ mở cửa đã bị xóa
router.get('/shop', authentication,asynHandler(openingHoursController.getAllOpeningHoursOfShopId)); // Lấy giờ mở cửa theo ID shop
router.patch('restore/:openingHours_id', asynHandler(openingHoursController.restoreOpeningHours)) // khôi phục giờ mở cửa

module.exports = router;
