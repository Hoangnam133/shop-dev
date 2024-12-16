// notification.js
import fetch from "node-fetch"; // Sử dụng import thay vì require

export const sendNotification = async (deviceToken, title, body, data) => {
  try {
    const message = {
      to: deviceToken,
      sound: "default",
      title: title,
      body: body,
      data: data,
    };

    // Gửi yêu cầu đến Expo Push Notification service
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    if (result.errors) {
      console.error("Push notification error:", result.errors);
    } else {
      console.log("Push notification sent successfully:", result);
    }
  } catch (error) {
    console.error("Failed to send push notification:", error);
  }
};
