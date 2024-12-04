const crypto = require('crypto');

function signSHA256(message, key) {
    // Chuyển chuỗi key và message thành định dạng Buffer UTF-8
    const keyBytes = Buffer.from(key, 'utf8');
    const messageBytes = Buffer.from(message, 'utf8');

    // Tạo HMAC-SHA256 với khóa bí mật
    const hmac = crypto.createHmac('sha256', keyBytes);

    // Băm message và lấy kết quả dưới dạng hex
    const hashMessage = hmac.update(messageBytes).digest('hex');

    // Chuyển kết quả thành chữ thường và bỏ dấu gạch nối
    return hashMessage.toLowerCase();
}

module.exports = {
    signSHA256,
};
