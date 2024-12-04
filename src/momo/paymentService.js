const axios = require('axios');
const { config } = require('../momo/config');
const { generateSignature, signSHA256 } = require('./gen_signature');
const { BadRequestError } = require('../core/errorResponse');

async function processMoMoPayment({ orderId, totalPrice }) {
    const requestId = `${config.partnerCode}-${Date.now()}`;
    const orderIdMoMo = `${config.partnerCode}-${orderId}-${Date.now()}`;
    const endpoint = config.MomoApiUrl;
    const secretKey = config.secretKey;
    const accessKey = config.accessKey;
    const returnUrl = config.returnUrl;
    const notifyUrl = config.notifyUrl;
    const partnerCode = config.partnerCode;
    const orderInfo = String(orderId);
    const extraData = '';
    const amount = String(Math.floor(totalPrice)); // Convert to string after flooring

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
        '&extraData=' +
        extraData;

    const signature = signSHA256(rawHash, secretKey);

    const body = {
        partnerCode,
        accessKey,
        requestId,
        amount, // amount is now a string
        orderId: orderIdMoMo,
        orderInfo,
        returnUrl,
        notifyUrl,
        extraData,
        requestType: config.requestType,
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
    processMoMoPayment,
};
