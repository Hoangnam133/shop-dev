const { processMoMoPayment } = require('./paymentService');

async function testMomoPayment() {
    const sampleOrderId = 'ORDER123'; // Mã đơn hàng mẫu
    const sampleTotalPrice = 100000;  // Số tiền thanh toán mẫu (đơn vị VNĐ)

    try {
        const payUrl = await processMoMoPayment(sampleOrderId, sampleTotalPrice);
        console.log('Pay URL:', payUrl);  // In ra URL thanh toán để kiểm tra
    } catch (error) {
        console.error('Payment failed:', error.message);
    }
}
testMomoPayment();
