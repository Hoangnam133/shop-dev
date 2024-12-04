const express = require("express");
const path = require("path");
const router = express.Router();
const { runProducer } = require('../../message_queue/rabbitmq/producer');

router.get('/getSuccess', async (req, res) => {
    const { orderInfo, message } = req.query;
    const errorCode = parseInt(req.query.errorCode, 10); // Chuyển errorCode thành số nguyên
    
    try {
        console.log('Thông tin nhận được:', req.query);
        res.sendFile(path.resolve(__dirname, '../../public/fontE/index.html'));

        if (errorCode === 0 && message === 'Success') {
            let payload = {
                orderInfo,
                shop_id: req.shop_id || 'Unknown Shop ID', // Kiểm tra shop_id nếu không có
            };
            console.log('Payload gửi tới RabbitMQ:', payload);

            // Gửi payload tới RabbitMQ
            await runProducer(payload);
        }
    } catch (error) {
        console.error('Lỗi xảy ra:', error);
        res.status(500).send('Có lỗi xảy ra trong quá trình xử lý thanh toán.');
    }
});

module.exports = router;
