// notification.js
const fetch = require("node-fetch"); // Sử dụng require cho node-fetch phiên bản 2.x

const sendNotification = async (deviceToken, title, body, data) => {
  try {
    const message = {
      to: deviceToken,
      sound: "default",
      title: title,
      body: body,
      data: { ...data, navigateTo: "/app/screens/auth/welcome" },
    };
    console.log("fầddfasfdasf" + message);

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

module.exports = { sendNotification };
