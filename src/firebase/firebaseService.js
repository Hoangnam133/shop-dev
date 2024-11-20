const admin = require('firebase-admin');

const sendNotification = async (token, title, body) => {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    return { success: true, response };
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  sendNotification,
};
