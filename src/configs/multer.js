const multer = require("multer");

// Sử dụng memoryStorage để lưu file vào bộ nhớ thay vì hệ thống file
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage, // Dùng bộ nhớ tạm
});

module.exports = upload;
