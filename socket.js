const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const userSockets = new Map();

function initializeWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on("connection", async (ws, req) => {
        try {
            const url = req?.url ?? "";
            const params = new URLSearchParams(url.includes("?") ? url.split("?")[1] : "");
            const token = params.get("token");

            if (!token) {
                ws.send(JSON.stringify({ type: "error", message: "Missing token" }));
                setTimeout(() => ws.close(1000, "Closing connection"), 100);
                return;
            }

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            } catch (err) {
                ws.send(JSON.stringify({ type: "error", message: "Invalid or expired token" }));
                setTimeout(() => ws.close(1000, "Closing connection"), 100);
                return;
            }

            const userId = decoded.userId;
            if (!userId) {
                ws.send(JSON.stringify({ type: "error", message: "Invalid token structure" }));
                setTimeout(() => ws.close(1000, "Closing connection"), 100);
                return;
            }

            if (!userSockets.has(userId)) {
                userSockets.set(userId, new Set());
            }
            userSockets.get(userId).add(ws);

            const { handleMessage } = require("./socket-manager");

            ws.on("message", (message) => {
                handleMessage(userId, message, ws);
            });

            ws.on("close", (code, reason) => {
                userSockets.get(userId)?.delete(ws);
                if (userSockets.get(userId)?.size === 0) {
                    userSockets.delete(userId);
                }
            });

        } catch (error) {
            setTimeout(() => ws.close(1000, "Closing due to server error"), 100);
        }
    });
}

module.exports = { initializeWebSocket, userSockets };
