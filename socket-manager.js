const recipeSubscriptions = new Map(); 

function handleMessage(userId, message, ws) {
    try {
        const data = JSON.parse(message);

        switch (data.type) {
            case "subscribe_recipe":
                const recipeId = String(data.recipeId);
                if (!recipeSubscriptions.has(recipeId)) {
                    recipeSubscriptions.set(recipeId, new Set());
                }
                recipeSubscriptions.get(recipeId).add(ws);
                break;

            case "unsubscribe_recipe":
                const unsubId = data.recipeId;
                recipeSubscriptions.get(unsubId)?.delete(ws);
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
    const { userSockets } = require("./socket");
    if (userSockets.has(userId)) {
        userSockets.get(userId).forEach((ws) => {
            if (!message.type) {
                message.type = "unknown";
            }
            ws.send(JSON.stringify(message));
        });
    }
}

function notifyRecipeUpdate(recipeId) {
    console.log(`Notifying subscribers of recipe ${recipeId}`);
    console.log("Subscribers for ALL recipes:");
    for (const [id, sockets] of recipeSubscriptions.entries()) {
        console.log(`• Recipe ${id} → ${sockets.size} subscriber(s)`);
    }
    const subscribers = recipeSubscriptions.get(String(recipeId));
    if (!subscribers) {
        console.log(`No subscribers for recipe ${recipeId}`);
        return;
    }
    if (subscribers) {
        console.log(`Notifying subscribers of recipe ${recipeId}`);
        for (const ws of subscribers) {
            ws.send(JSON.stringify({
                type: "recipe_update",
                recipeId,
            }));
        }
    }
}

module.exports = { handleMessage, sendMessageToUser, notifyRecipeUpdate };
