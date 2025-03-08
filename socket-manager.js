function handleMessage(userId, message, ws) {
    try {
        const data = JSON.parse(message);

        switch (data.type) {
            case "chat":
                console.log(`User ${userId} sent a chat message: ${data.content}`);
                break;

            default:
                console.log(`Received unknown message type from user ${userId}`);
        }
    } catch (err) {
        console.error("Error processing message:", err);
        ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
}

function sendMessageToUser(userId, message) {
    const { userSockets } = require("./socket"); // Lazy import
    if (userSockets.has(userId)) {
        userSockets.get(userId).forEach((ws) => {
            ws.send(JSON.stringify(message));
        });
    }
}

function removeUserSessions(userId) {
    const { userSockets } = require("./socket"); // Lazy import
    if (userSockets.has(userId)) {
        userSockets.get(userId).forEach((ws) => {
            ws.send(JSON.stringify({ type: "force_logout", message: "You have been logged out." }));
            ws.close();
        });
        userSockets.delete(userId);
    }
}

module.exports = { handleMessage, sendMessageToUser, removeUserSessions };
