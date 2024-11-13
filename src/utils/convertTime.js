const moment = require("moment-timezone");
const getCurrentDateInTimeZone = () => {
  const date = new Date();
  const timeZone = "Asia/Ho_Chi_Minh";
  const format = "YYYY-MM-DD HH:mm:ss";
  const momentDate = moment(date);
  return momentDate.tz(timeZone).format(format);
};
const options = {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};
const convertTimeToVN = (secondsToAdd) => {
  const currentTime = new Date();
  const estimateDeliveryTime = new Date(
    currentTime.getTime() + secondsToAdd * 1000
  );
  return {
    deliveryTime: estimateDeliveryTime.toLocaleString("vi-VN", options),
    timeOrder: currentTime.toLocaleString("vi-VN", options),
  };
};
const convertToVietnamTime = () => {
  const currentDate = new Date();
  const vietnamOffset = 7 * 60; // Chênh lệch múi giờ Việt Nam (UTC+7)
  const localTimeOffset = currentDate.getTimezoneOffset();
  const timeDifference = (vietnamOffset - localTimeOffset) * 60000;
  return new Date(currentDate.getTime() + timeDifference);
};

console.log(convertToVietnamTime()); // Ví dụ: "2024-09-27"

module.exports = {
  convertTimeToVN,
  convertToVietnamTime,
  getCurrentDateInTimeZone,
};
