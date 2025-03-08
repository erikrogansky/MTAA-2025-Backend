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
                console.error("WebSocket Connection closed: Missing token");
                ws.send(JSON.stringify({ type: "error", message: "Missing token" }));
                setTimeout(() => ws.close(1000, "Closing connection"), 100);
                return;
            }
    
            console.log("🔹 Received Token:", token);
    
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
                if (err) {
                    console.error("❌ Invalid or expired token:", err.message);
                    ws.send(JSON.stringify({ type: "error", message: "Invalid or expired token" }));
                    setTimeout(() => ws.close(1000, "Closing connection"), 100);
                    return;
                }
    
                const userId = decoded.userId;
                if (!userId) {
                    console.error("❌ Token does not contain 'user_id'. Received payload:", decoded);
                    ws.send(JSON.stringify({ type: "error", message: "Invalid token structure" }));
                    setTimeout(() => ws.close(1000, "Closing connection"), 100);
                    return;
                }
    
                const session = await prisma.session.findFirst({ where: { userId, accessToken: token } });
    
                if (!session) {
                    console.error("❌ No active session found for user:", userId);
                    ws.send(JSON.stringify({ type: "error", message: "Session expired or invalid" }));
                    setTimeout(() => ws.close(1000, "Closing connection"), 100);
                    return;
                }
    
                console.log(`✅ User ${userId} authenticated and connected to WebSocket`);
    
                if (!userSockets.has(userId)) {
                    userSockets.set(userId, new Set());
                }
                userSockets.get(userId).add(ws);
    
                const { handleMessage } = require("./socket-manager");
    
                ws.on("message", (message) => {
                    console.log(`📩 Received message from ${userId}: ${message}`);
                    handleMessage(userId, message, ws);
                });
    
                ws.on("close", (code, reason) => {
                    console.log(`❎ WebSocket closed for user ${userId}. Code: ${code}, Reason: ${reason}`);
                    userSockets.get(userId)?.delete(ws);
                    if (userSockets.get(userId)?.size === 0) {
                        userSockets.delete(userId);
                    }
                });
            });
    
        } catch (error) {
            console.error("🚨 Unexpected WebSocket Error:", error);
            setTimeout(() => ws.close(1000, "Closing due to server error"), 100);
        }
    });

    console.log("WebSocket server initialized.");
}

module.exports = { initializeWebSocket, userSockets };
