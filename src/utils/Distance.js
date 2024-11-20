const dotenv = require('dotenv');
dotenv.config()
const calculateDistance = ({userLat, userLon, facilityLat, facilityLon}) => {
    const toRad = (value) => (value * Math.PI) / 180; // Chuyển độ sang radian
    const R = 6371; // Bán kính Trái Đất (km)
  
    const dLat = toRad(facilityLat - userLat);
    const dLon = toRad(facilityLon - userLon);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLat)) * Math.cos(toRad(facilityLat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c; // Khoảng cách (km)
  };
  
//   // Tọa độ của người dùng và cơ sở
//   const userLat = 21.0285; // Vĩ độ của người dùng
//   const userLon = 105.8542; // Kinh độ của người dùng
//   const facilityLat = 21.0278; // Vĩ độ của cơ sở
//   const facilityLon = 105.8342; // Kinh độ của cơ sở
  
  
  
//   // Tính khoảng cách
//   const distance = calculateDistance(userLat, userLon, facilityLat, facilityLon);
//   const ALLOWED_RADIUS = process.env.ALLOWED_RADIUS
//   // Kiểm tra khoảng cách
//   if (distance <= ALLOWED_RADIUS) {
//     console.log(`Bạn đang trong bán kính ${ALLOWED_RADIUS} km (${distance.toFixed(2)} km), cho phép đặt hàng!`);
//   } else {
//     console.log(`Bạn đang ngoài bán kính ${ALLOWED_RADIUS} km (${distance.toFixed(2)} km), không thể đặt hàng.`);
//   }
module.exports = {
    calculateDistance
}
  