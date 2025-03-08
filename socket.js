const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const userSockets = new Map();

function initializeWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on("connection", (ws, req) => {
        const params = new URLSearchParams(req.url.split("?")[1]);
        const token = params.get("token");

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.user_id;

            if (!userSockets.has(userId)) {
                userSockets.set(userId, new Set());
            }
            userSockets.get(userId).add(ws);

            // Lazy import to avoid circular dependency
            const { handleMessage } = require("./socket-manager");

            ws.on("message", (message) => {
                handleMessage(userId, message, ws);
            });

            ws.on("close", () => {
                userSockets.get(userId).delete(ws);
                if (userSockets.get(userId).size === 0) {
                    userSockets.delete(userId);
                }
            });

        } catch (error) {
            ws.send(JSON.stringify({ error: "Invalid or expired token" }));
            ws.close();
        }
    });

    console.log("WebSocket server initialized.");
}

module.exports = { initializeWebSocket, userSockets };
