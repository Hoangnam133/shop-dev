const express = require('express');
const bodyParser = require('body-parser');
const { processMoMoPayment } = require('./paymentService');
const app = express();
const PORT = 3000;

app.use(bodyParser.json()); // Middleware để phân tích cú pháp JSON

app.get('/paymentSuccess', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <title>Thanh toán thành công</title>
        </head>
        <body>
            <h1>Thanh toán thành công</h1>
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
        </body>
        </html>
    `);
});

app.post('/callback', (req, res) => {
    // Xử lý thông tin từ MoMo ở đây
    console.log('Callback data:', req.body);
    
    // Gửi phản hồi về cho MoMo
    res.status(200).send('OK');
});

// Route để khởi tạo thanh toán
app.post('/initiatePayment', async (req, res) => {
    const { orderId, totalPrice } = req.body; // Giả định bạn gửi orderId và totalPrice trong body

    try {
        const payUrl = await processMoMoPayment(orderId, totalPrice);
        res.json({ payUrl }); // Trả về payUrl để client có thể điều hướng đến thanh toán
    } catch (error) {
        console.error('Payment failed:', error.message);
        res.status(500).json({ error: 'Payment initiation failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
