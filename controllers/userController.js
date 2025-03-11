const { prisma } = require('../db');
const jwt = require("jsonwebtoken");

const getUserData = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Authorization token required" });
        }

        const accessToken = authHeader.split(" ")[1];

        let decoded;
        try {
            decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        } catch (error) {
            return res.status(403).json({ message: "Invalid or expired access token" });
        }

        const userId = decoded.userId;
        if (!userId) {
            return res.status(401).json({ message: "Invalid token payload" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                oauthAccounts: true, // Fetch linked OAuth accounts
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = {
            name: user.name,
            hasPassword: user.password !== null,
            hasFacebookAuth: user.oauthAccounts.some(account => account.provider === "facebook"),
            hasGoogleAuth: user.oauthAccounts.some(account => account.provider === "google"),
            darkMode: user.darkMode,
        };

        res.json(userData);
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { getUserData };
