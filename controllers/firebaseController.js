const { prisma } = require("../db");

const updateFirebaseToken = async (req, res) => {
    try {
        const { deviceId, firebaseToken } = req.body;

        if (!deviceId || !firebaseToken) {
            return res.status(400).json({ message: "Device ID and Firebase token required" });
        }

        // Update device token
        await prisma.device.upsert({
            where: { deviceId },
            update: { firebaseToken },
            create: { deviceId, firebaseToken, userId: null }, // Temporary storage, updated later
        });

        res.json({ message: "Firebase token updated successfully" });
    } catch (error) {
        console.error("Error updating Firebase token:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { updateFirebaseToken };