const firebaseService = require("./firebaseService");

// Controller gửi thông báo
const sendNotification = async (req, res) => {
  const { token, title, body } = req.body; // Nhận token, tiêu đề và nội dung từ request

  if (!token || !title || !body) {
    return res.status(400).json({
      success: false,
      message: "Token, title, và body là bắt buộc!",
    });
  }

  try {
    const result = await firebaseService.sendNotification(token, title, body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  sendNotification,
};
