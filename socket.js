const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const userSockets = new Map();

function initializeWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on("connection", (ws, req) => {
        const params = new URLSearchParams(req.url.split("?")[1]);
        const token = params.get("token");
    
        if (!token) {
            ws.send(JSON.stringify({ type: "error", message: "Missing token" }));
            console.error("WebSocket Connection closed: Missing token");
            ws.close();
            return;
        }
    
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const userId = decoded.user_id;
    
            console.log(`User ${userId} connected to WebSocket`);
    
            if (!userSockets.has(userId)) {
                userSockets.set(userId, new Set());
            }
            userSockets.get(userId).add(ws);
    
            const { handleMessage } = require("./socket-manager");
    
            ws.on("message", (message) => {
                console.log(`Received message from ${userId}: ${message}`);
                handleMessage(userId, message, ws);
            });
    
            ws.on("close", (code, reason) => {
                console.log(`WebSocket closed for user ${userId}. Code: ${code}, Reason: ${reason}`);
                userSockets.get(userId)?.delete(ws);
                if (userSockets.get(userId)?.size === 0) {
                    userSockets.delete(userId);
                }
            });
    
        } catch (error) {
            console.error("WebSocket Connection closed: Invalid or expired token", error);
            ws.send(JSON.stringify({ type: "error", message: "Invalid or expired token" }));
            ws.close();
        }
    });    

    console.log("WebSocket server initialized.");
}

module.exports = { initializeWebSocket, userSockets };
