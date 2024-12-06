// configs/multer-storage-cloudinary.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary"); // Import cấu hình Cloudinary

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "user_avatars", // Thư mục trên Cloudinary
    allowed_formats: ["jpg", "jpeg", "png"], // Các định dạng file được phép
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
