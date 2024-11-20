const admin = require("firebase-admin");
const serviceAccount = require("../../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
console.log("Firebase Admin SDK initialized.");

module.exports = admin;