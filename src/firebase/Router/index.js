const express = require('express');
const notificationController = require('../notificationController');

const router = express.Router();

// Route gửi thông báo
router.post('/send-notification', notificationController.sendNotification);

module.exports = router;
