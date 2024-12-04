const express = require("express");
const path = require("path");
const router = express.Router();
const { runProducer } = require('../../message_queue/rabbitmq/producer');

router.get('/getSuccess', async (req, res) => {
    const { orderInfo, message, extraData, amount } = req.query;
    const errorCode = parseInt(req.query.errorCode, 10); 
    
    try {
        console.log('Thông tin nhận được:', req.query);
        if (errorCode === 0 && message === 'Success') {
            let payload = {
                orderInfo,
                shop_id: extraData || 'Unknown Shop ID', 
                amount
            };
            console.log('Payload gửi tới RabbitMQ:', payload);
            await runProducer(payload);
            res.status(200).send({
                status: 200,
                message: 'Thanh toán thành công. Cảm ơn bạn đã mua hàng!'
            }); 
        }
        else{
            res.status(500).send({
                status: 500,
                message: 'Có lỗi xảy ra trong quá trình xử lý thanh toán. Vui lòng thử lại sau.'
            });
        }
    } catch (error) {
        console.error('Lỗi xảy ra:', error);
        res.status(500).send('Có lỗi xảy ra trong quá trình xử lý thanh toán.');
    }
});

module.exports = router;
