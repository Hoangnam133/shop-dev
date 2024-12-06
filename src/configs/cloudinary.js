const cloudinary = require("cloudinary").v2;

// Cấu hình với tài khoản Cloudinary của bạn
cloudinary.config({
  cloud_name: "dluwhbsel", // Tên Cloudinary của bạn
  api_key: "164868145516717", // API key
  api_secret: "3j_wIiiYPmTGugr9TOpLKV_TkGA", // API secret
});

module.exports = cloudinary;
