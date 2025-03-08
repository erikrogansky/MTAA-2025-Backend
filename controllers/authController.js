const { prisma, redis } = require('../db');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { sendMessageToUser } = require("../socket-manager");

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });

    return { accessToken, refreshToken };
};

const register = async (req, res) => {
    try {
        const { name, email, password, preferences, deviceId } = req.body;

        if (!name) return res.status(400).json({ message: "Name required" });
        if (!email) return res.status(400).json({ message: "Email required" });
        if (!password) return res.status(400).json({ message: "Password required" });
        if (!deviceId) return res.status(400).json({ message: "Device ID required" });

        if (name.length < 2) return res.status(400).json({ message: "Name must be at least 2 characters" });
        if (email.length < 6) return res.status(400).json({ message: "Email must be at least 6 characters" });
        if (email && !email.includes("@")) return res.status(400).json({ message: "Invalid email" });
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ message: "Invalid email format" });
        if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters"});
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: "Password must be at least 6 characters, including letters and numbers" });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: "Email already in use" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                preferences: preferences || [],
            },
        });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id);

        // Create device if not exists
        await prisma.device.upsert({
            where: { deviceId },
            update: {},
            create: { userId: user.id, deviceId },
        });

        // Create session
        await prisma.session.create({
            data: {
                userId: user.id,
                deviceId,
                refreshToken,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
        });

        res.status(201).json({ accessToken, refreshToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const login = async (req, res) => {
    try {
        const { email, password, deviceId } = req.body;
        if (!deviceId) return res.status(400).json({ message: "Device ID required" });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const { accessToken, refreshToken } = generateTokens(user.id);

        // Create or update device
        await prisma.device.upsert({
            where: { deviceId },
            update: {},
            create: { userId: user.id, deviceId },
        });

        // Create or update session per device
        await prisma.session.upsert({
            where: { deviceId },
            update: { refreshToken, expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
            create: { userId: user.id, deviceId, refreshToken, expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
        });

        res.json({ accessToken, refreshToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken, deviceId } = req.body;
        const authHeader = req.headers.authorization;

        if (!refreshToken || !deviceId) {
            return res.status(401).json({ message: "Refresh token and device ID required" });
        }

        const session = await prisma.session.findUnique({ where: { deviceId, refreshToken } });
        if (!session) return res.status(403).json({ message: "Invalid refresh token or device" });

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ message: "Invalid refresh token" });

            if (authHeader && authHeader.startsWith("Bearer ")) {
                const oldAccessToken = authHeader.split(" ")[1];
                const expiry = process.env.ACCESS_TOKEN_EXPIRY || "15m";
                const expirySeconds = parseInt(expiry) * 60;

                await redis.setex(`blacklist:${oldAccessToken}`, expirySeconds, "blacklisted");
            }

            const newAccessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });

            res.json({ accessToken: newAccessToken });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const logout = async (req, res) => {
    try {
        const { refreshToken, deviceId } = req.body;
        const authHeader = req.headers.authorization;

        if (!refreshToken || !deviceId) {
            return res.status(400).json({ message: "Refresh token and device ID required" });
        }

        const session = await prisma.session.findFirst({
            where: { deviceId, refreshToken },
        });

        if (!session) {
            return res.status(401).json({ message: "Invalid or expired refresh token" });
        }

        await prisma.session.deleteMany({ where: { deviceId, refreshToken } });
        await prisma.device.deleteMany({ where: { deviceId } });

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const accessToken = authHeader.split(" ")[1];
            const expiry = process.env.ACCESS_TOKEN_EXPIRY || "15m";
            const expirySeconds = parseInt(expiry) * 60;
            await redis.setex(`blacklist:${accessToken}`, expirySeconds, "blacklisted");
        }

        res.json({ message: "Logged out from this device" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};



const logoutAll = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const authHeader = req.headers.authorization;

        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token required" });
        }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ message: "Invalid refresh token" });

            const userId = decoded.userId;

            const sessions = await prisma.session.findMany({ where: { userId } });

            if (!sessions.length) {
                return res.status(400).json({ message: "No active sessions found" });
            }

            await prisma.session.deleteMany({ where: { userId } });
            await prisma.device.deleteMany({ where: { userId } });

            if (authHeader && authHeader.startsWith("Bearer ")) {
                const accessToken = authHeader.split(" ")[1];
                const expiry = process.env.ACCESS_TOKEN_EXPIRY || "15m";
                const expirySeconds = parseInt(expiry) * 60;
                await redis.setex(`blacklist:${accessToken}`, expirySeconds, "blacklisted");
            }

            sendMessageToUser(userId, { type: "force_logout", message: "You have been logged out from all devices." });

            res.json({ message: "Logged out from all devices" });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { register, login, refreshAccessToken, logout, logoutAll };
