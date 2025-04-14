// This module initializes Firebase Admin SDK and provides a function to send push notifications using Firebase Cloud Messaging (FCM).
const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(require("../mtaa-95655-43134b63354d.json")),
    });
}

const sendPushNotification = async (tokens, title, body) => {
    if (!tokens || tokens.length === 0) {
        return;
    }

    const message = {
        notification: { title, body },
        tokens,
        android: { priority: "high" },
        apns: { payload: { aps: { sound: "default" } } },
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);

        if (response.failureCount > 0) {
            console.error("Some tokens failed:", response.responses.filter(r => !r.success));
        }
    } catch (error) {
        console.error("Error sending push notification:", error);
    }
};

module.exports = { sendPushNotification };