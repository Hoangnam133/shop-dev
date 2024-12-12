const express = require("express");
const path = require("path");
const router = express.Router();
const { runProducer } = require('../../message_queue/rabbitmq/producer');
const { asynHandler } = require("../../utils/handler");
const { authentication, authorizeRoles } = require("../../auth/authUtils")
const axios = require('axios');
const moMoRefundController = require("../../controllers/moMoRefundController");

router.post('/refunds', authentication, asynHandler(moMoRefundController.refund))
let paymentResults = {}; 

router.get('/getSuccess', async (req, res) => {
    const { orderInfo, message, extraData, amount, transId  } = req.query;
    const errorCode = parseInt(req.query.errorCode, 10); 
    
    try {
        console.log('Thông tin nhận được:', req.query);
        
        if (errorCode === 0 && message === 'Success') {
            let payload = {
                orderInfo,
                shop_id: extraData || 'Unknown Shop ID', 
                transId
            };
            console.log('Payload gửi tới RabbitMQ:', payload);
            await runProducer(payload);
            
            // Lưu kết quả thanh toán thành công
            paymentResults= { status: 'success', amount };

            res.status(200).send({
                status: 200,
                message: 'Thanh toán thành công. Cảm ơn bạn đã mua hàng!'
            });
        } else {
            // Lưu kết quả thanh toán thất bại
            paymentResults = { status: 'failed', message: 'Thanh toán thất bại. Vui lòng thử lại.' };

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


router.get('/result', (req, res) => {
    
    res.status(200).send({
        status: 200,
        message: 'Kết quả thanh toán:',
        results: paymentResults
    });
});

module.exports = router;
