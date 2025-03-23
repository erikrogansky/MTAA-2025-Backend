const { prisma } = require('../db');
const bcrypt = require('bcrypt');

const getUserData = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                oauthAccounts: true,
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
            profilePictureUrl: user.profilePicture ? `${process.env.SERVER_URL}/profile-pictures/${user.id}.jpg` : null,
        };

        res.json(userData);
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const updateUser = async (req, res) => {
    const { name, profilePicture, mode, preferences } = req.body;
    const userId = req.user.id; 

    if (!name && !profilePicture && !mode && !preferences) {
        return res.status(400).json({ message: "No valid fields provided for update" });
    }

    try {
        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
        if (mode !== undefined) {
            const validDarkModes = ["y", "n", "s"];
            if (!validDarkModes.includes(mode)) {
                return res.status(400).json({ message: "Invalid mode value. Allowed: y, n, s" });
            }
            updateData.darkMode = mode;
        }
        if (Array.isArray(preferences)) updateData.preferences = preferences;

        await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        res.json({ message: "User data updated", updatedFields: updateData });
    } catch (error) {
        console.error("Error updating user data:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
    }

    try {
        if (user.password) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required" });
            }

            const passwordMatch = await bcrypt.compare(currentPassword, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ message: "Current password is incorrect" });
            }
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        res.json({ message: "Password updated" });
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const deleteUser = async (req, res) => {
    const userId = req.user.id;

    try {
        await prisma.user.delete({
            where: { id: userId },
        });

        res.json({ message: "User deleted" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const changePicture = async (req, res) => {
    const userId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
    
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        const imageUrl = `/profile_pictures/${userId}.jpg`;

        if (!user.profilePicture) {
            await prisma.user.update({
                where: { id: userId },
                data: { profilePicture: imageUrl },
            });
        }

        res.json({ message: "Profile picture updated", imageUrl });
    } catch (err) {
        console.error("Error saving uploaded picture:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { getUserData, updateUser, changePassword, deleteUser, changePicture };
