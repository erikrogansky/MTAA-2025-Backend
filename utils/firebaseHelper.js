const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(require("../mtaa-95655-firebase-adminsdk-fbsvc-9aba7815aa.json")),
    });
}

const sendPushNotification = async (tokens, title, body) => {
    if (!tokens || tokens.length === 0) return;

    const message = {
        tokens,
        notification: {
            title,
            body,
        },
        android: {
            priority: "high",
        },
        apns: {
            payload: {
                aps: { sound: "default" },
            },
        },
    };

    try {
        const response = await admin.messaging().sendMulticast(message);
        console.log(`Sent notification: ${response.successCount} successful, ${response.failureCount} failed`);
    } catch (error) {
        console.error("Error sending push notification:", error);
    }
};

module.exports = { sendPushNotification };
