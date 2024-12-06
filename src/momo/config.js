const config = {
    MomoApiUrl: 'https://test-payment.momo.vn/gw_payment/transactionProcessor',
    secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    accessKey: 'F8BBA842ECF85',
    partnerCode: 'MOMO',
    // returnUrl: 'http://localhost:3000/v2/api/momoSuccess/getSuccess', // URL sẽ nhận kết quả sau thanh toán
    // notifyUrl: 'http://localhost:3000/v2/api/momoSuccess/getSuccess', // URL callback nhận thông báo từ MoMo
    returnUrl: 'http://localhost:3000/v2/api/momoSuccess/getSuccess', // URL nhận kết quả thanh toán
    notifyUrl: 'http://localhost:3000/v2/api/momoSuccess/getSuccess', // URL callback từ MoMo
    requestType: 'captureMoMoWallet',
    partnerCode: 'MOMO',
    orderInfo: 'pay with MoMo',
    lang: 'vi',
};

module.exports = {
    config,
};
