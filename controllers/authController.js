const { prisma, redis } = require('../db');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendPushNotification } = require("../utils/firebaseHelper");
const admin = require("firebase-admin");
const { sendMessageToUser } = require("../socket-manager");
const { generateInitialsImage } = require("../utils/generateImage");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(require("../mtaa-95655-firebase-adminsdk-fbsvc-9aba7815aa.json")),
    });
}

// Function to generate access and refresh tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY });

    return { accessToken, refreshToken };
};

// Function to register a new user
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

        const profilePath = await generateInitialsImage(name, user.id);
        await prisma.user.update({
            where: { id: user.id },
            data: { profilePicture: profilePath },
        });

        const { accessToken, refreshToken } = generateTokens(user.id);

        await prisma.device.upsert({
            where: { deviceId },
            update: {},
            create: { userId: user.id, deviceId },
        });

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

// Function to login a user
const login = async (req, res) => {
    try {
        const { email, password, deviceId, firebaseToken } = req.body;
        if (!deviceId) return res.status(400).json({ message: "Device ID required" });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const { accessToken, refreshToken } = generateTokens(user.id);

        const userDevices = await prisma.device.findMany({
            where: { userId: user.id, NOT: { deviceId } },
            select: { firebaseToken: true },
        });

        const tokens = userDevices
            .map(d => d.firebaseToken)
            .filter(token => token && token !== firebaseToken);

        if (tokens.length > 0) {
            sendPushNotification(
                tokens,
                "New Login Detected",
                "Your account was accessed from a new device."
            );
        }

        await prisma.device.upsert({
            where: { deviceId },
            update: { firebaseToken, userId: user.id },
            create: { userId: user.id, deviceId, firebaseToken },
        });

        await prisma.session.upsert({
            where: { deviceId },
            update: { refreshToken, expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
            create: { userId: user.id, deviceId, refreshToken, expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
        });

        res.json({ accessToken, refreshToken, darkMode: user.darkMode });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Function to download profile picture from OAuth provider
const downloadProfilePicture = async (imageUrl, userId) => {
    try {
        const profileDir = path.join(__dirname, "../profile_pictures");
        if (!fs.existsSync(profileDir)) {
            fs.mkdirSync(profileDir, { recursive: true });
        }

        const filePath = path.join(profileDir, `${userId}.jpg`);
        const response = await axios({ url: imageUrl, responseType: "stream" });
        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on("finish", () => resolve(filePath));
            writer.on("error", reject);
        });
    } catch (error) {
        console.error("Error downloading profile picture:", error);
        return null;
    }
};

// Function to handle OAuth login
const oauthLogin = async (req, res) => {
    try {
        const { idToken, deviceId, firebaseToken, provider } = req.body;
        if (!idToken) return res.status(400).json({ message: "ID Token is required" });
        if (!deviceId) return res.status(400).json({ message: "Device ID is required" });
        if (!provider) return res.status(400).json({ message: "OAuth provider is required" });

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        if (!decodedToken || !decodedToken.email) {
            return res.status(401).json({ message: "Invalid ID Token" });
        }

        const { email, name, picture, uid } = decodedToken;

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            const profilePath = picture ? await downloadProfilePicture(picture, uid) : null;

            user = await prisma.user.create({
                data: {
                    name: name || "User",
                    email,
                    password: null,
                    profilePicture: profilePath,
                },
            });
        }

        const existingOAuth = await prisma.oAuthAccount.findFirst({
            where: { provider, providerId: uid },
        });

        if (!existingOAuth) {
            await prisma.oAuthAccount.create({
                data: {
                    userId: user.id,
                    provider,
                    providerId: uid,
                },
            });
        }

        const { accessToken, refreshToken } = generateTokens(user.id);

        const userDevices = await prisma.device.findMany({
            where: { userId: user.id, NOT: { deviceId } },
            select: { firebaseToken: true },
        });

        const tokens = userDevices.map(d => d.firebaseToken).filter(token => token && token !== firebaseToken);
        if (tokens.length > 0) {
            sendPushNotification(
                tokens,
                "New Login Detected",
                "Your account was accessed from a new device."
            );
        }

        await prisma.device.upsert({
            where: { deviceId },
            update: { firebaseToken, userId: user.id },
            create: { userId: user.id, deviceId, firebaseToken },
        });

        await prisma.session.upsert({
            where: { deviceId },
            update: { refreshToken, expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
            create: { userId: user.id, deviceId, refreshToken, expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
        });

        res.json({ accessToken, refreshToken });
    } catch (error) {
        console.error("OAuth Login Error:", error);
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

module.exports = { register, login, oauthLogin, refreshAccessToken, logout, logoutAll };
