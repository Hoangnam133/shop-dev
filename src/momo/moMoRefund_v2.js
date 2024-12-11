const axios = require('axios');
const { config } = require('../momo/config');
const crypto = require('crypto');
const { BadRequestError } = require('../core/errorResponse');

function signSHA256(message, key) {
    const hmac = crypto.createHmac('sha256', key);
    return hmac.update(message).digest('hex');
}

async function processMoMoRefund(orderId, trans_Id, totalPrice, transGroup) {
    const requestId = `${config.partnerCode}-${Date.now()}`;
    const orderIdMoMo = `${config.partnerCode}-${orderId}-${Date.now()}`;
    const endpoint = config.MomoApiUrl;
    const secretKey = config.secretKey;
    const accessKey = config.accessKey;
    const returnUrl = config.returnUrl;
    const notifyUrl = config.notifyUrl;
    const partnerCode = config.partnerCode;
    const orderInfo = String(orderId); // Description (order info) sẽ là orderId ở đây
    const amount = String(Math.floor(totalPrice)); // Convert to string after flooring
    const transId = String(trans_Id);
    const lang = 'vi'; // Ngôn ngữ trả về: 'vi' cho tiếng Việt hoặc 'en' cho tiếng Anh

    // Tạo chuỗi rawHash theo đúng định dạng yêu cầu của MoMo
    const rawHash =
        'accessKey=' + accessKey +
        '&amount=' + amount +
        '&description=' + orderInfo +  // Thêm mô tả ở đây (có thể là thông tin đơn hàng)
        '&orderId=' + orderIdMoMo +
        '&partnerCode=' + partnerCode +
        '&requestId=' + requestId +
        '&transId=' + transId;

    // In chuỗi rawHash ra để kiểm tra
    console.log("Raw Hash: ", rawHash);

    // Tạo chữ ký HMAC_SHA256
    const signature = signSHA256(rawHash, secretKey);

    // In chữ ký ra để kiểm tra
    console.log("Signature: ", signature);

    // Tạo body request để gửi cho MoMo
    const body = {
        partnerCode,
        accessKey,
        requestId,
        amount,
        orderId: orderIdMoMo,
        orderInfo,
        returnUrl,
        notifyUrl,
        transId,
        requestType: 'refundMoMoWallet',
        lang,
        description: '',  // Có thể thêm mô tả cho yêu cầu hoàn tiền
        transGroup: transGroup,  // Thông tin các mặt hàng hoàn tiền
        signature,  // Chữ ký
    };

    // In toàn bộ body để kiểm tra các tham số
    console.log("Request Body: ", body);

    try {
        // Gửi yêu cầu đến MoMo
        const response = await axios.post(endpoint, body);

        if (!response) {
            throw new BadRequestError('Cannot make payment request');
        }

        // In kết quả trả về từ MoMo
        console.log('Response from MoMo:', response.data);

        return response.data.deeplink; // Return payUrl nếu thành công
    } catch (error) {
        console.error('MoMo payment request failed: ', error.message);
        throw new Error('MoMo payment request failed: ' + error.message);
    }
}

module.exports = {
    processMoMoRefund,
};
