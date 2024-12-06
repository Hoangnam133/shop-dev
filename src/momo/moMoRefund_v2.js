const axios = require('axios');
const { config } = require('../momo/config');
const { signSHA256 } = require('./gen_signature');
const { BadRequestError } = require('../core/errorResponse');
const { exec } = require('child_process');
function openLink(url) {
    try {
        const platform = process.platform; // Kiểm tra hệ điều hành
        let command;

        if (platform === 'win32') {
            // Windows
            command = `start "" "${url}"`; // Bọc URL trong dấu ngoặc kép
        } else if (platform === 'darwin') {
            // macOS
            command = `open "${url}"`;
        } else {
            // Linux
            command = `xdg-open "${url}"`;
        }

        exec(command, (error) => {
            if (error) {
                console.error('Không thể mở liên kết:', error.message);
            } else {
                console.log(`Đã mở liên kết: ${url}`);
            }
        });
    } catch (error) {
        console.error('Lỗi xảy ra:', error.message);
    }
}
async function processMoMoRefund(orderId, trans_Id ,totalPrice ) {
    const requestId = `${config.partnerCode}-${Date.now()}`;
    const orderIdMoMo = `${config.partnerCode}-${orderId}-${Date.now()}`;
    const endpoint = config.MomoApiUrl;
    const secretKey = config.secretKey;
    const accessKey = config.accessKey;
    const returnUrl = config.returnUrl;
    const notifyUrl = config.notifyUrl;
    const partnerCode = config.partnerCode;
    const orderInfo = String(orderId);
    const amount = String(Math.floor(totalPrice)); // Convert to string after flooring
    const transId = String(trans_Id);

    const rawHash =
        'partnerCode=' +
        partnerCode +
        '&accessKey=' +
        accessKey +
        '&requestId=' +
        requestId +
        '&amount=' +
        amount + 
        '&orderId=' +
        orderIdMoMo +
        '&orderInfo=' +
        orderInfo +
        '&returnUrl=' +
        returnUrl +
        '&notifyUrl=' +
        notifyUrl +
        '&transId=' + 
        transId;

    const signature = signSHA256(rawHash, secretKey);

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
        signature,
    };

    console.log(body);

    try {
        const response = await axios.post(endpoint, body);
        if (!response) {
            throw new BadRequestError('Cannot make payment request');
        }
        console.log('Response from MoMo:', response.data);

        return response.data.deeplink; // Return payUrl
    } catch (error) {
        throw new Error('MoMo payment request failed: ' + error.message);
    }
}

module.exports = {
    processMoMoRefund,
};
