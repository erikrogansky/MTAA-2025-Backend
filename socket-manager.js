const recipeSubscriptions = new Map(); 

function handleMessage(userId, message, ws) {
    try {
        const data = JSON.parse(message);

        switch (data.type) {
            case "subscribe_recipe":
                const recipeId = data.recipeId;
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
        
        console.log("Subscribed to recipe:", recipeSubscriptions);
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
    const subscribers = recipeSubscriptions.get(recipeId);
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
