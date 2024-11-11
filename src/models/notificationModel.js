const { model, Schema } = require('mongoose');
const DOCUMENT_NAME = 'Notification';
const COLLECTION_NAME = 'Notifications'; // Tên collection có thể đặt ở số nhiều cho phù hợp

// Đối tượng enum để giữ các loại thông báo cho dễ quản lý
const NotificationType = {
  ORDER_SUCCESS: 'ORDER-001',
  ORDER_FAILED: 'ORDER-002',
  ORDER_RECEIVED: 'ORDER-003',
  PROMOTION: 'PROMOTION-001',
  SHOP_NEW_PRODUCT: 'SHOP-001'
};

const notificationSchema = new Schema({
  // Loại thông báo
  type: {
    type: String,
    enum: Object.values(NotificationType), // Đảm bảo chỉ dùng giá trị từ enum
    required: true,
    description: 'The type of notification indicating its purpose'
  },
  // ID của người gửi thông báo (chẳng hạn cửa hàng, admin, hệ thống)
  senderId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Có thể tham chiếu tới User nếu cần thiết
    description: 'The ID of the sender of the notification'
  },
  // ID của người nhận thông báo (có thể là khách hàng)
  receiverId: {
    type: Schema.Types.ObjectId, // Nên đồng nhất kiểu dữ liệu, dùng ObjectId thay cho Number
    required: true,
    ref: 'User',
    description: 'The ID of the receiver of the notification'
  },
  // Nội dung thông báo
  content: {
    type: String,
    required: true,
    trim: true,
    description: 'The content of the notification, explaining the purpose'
  },
}, {
  timestamps: true, 
  collection: COLLECTION_NAME
});

// Xuất enum để sử dụng bên ngoài nếu cần
module.exports = {
  NotificationModel: model(DOCUMENT_NAME, notificationSchema),
  NotificationType
};
