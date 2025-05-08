const { prisma } = require('../db');
const bcrypt = require('bcrypt');

// Function to get user data for account settings
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

// Function to update user data
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

// Function to change user password
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

// Function to delete user account
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

// Function to change user profile picture
const changePicture = async (req, res) => {
    const userId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
    
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        const imageUrl = `${userId}.jpg`;

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

// Function to create, update or delete a hydration reminder
const setHydrationReminder = async (req, res) => {
    const userId = req.user.id;
    const { timezone, startHour, endHour, interval, remove } = req.body;

    try {
        const existing = await prisma.hydrationReminder.findUnique({
            where: { userId },
        });

        if (remove) {
            if (existing) {
                await prisma.hydrationReminder.delete({ where: { userId } });
            }
            return res.json({ message: "Hydration reminder deleted" });
        }

        if (!timezone || startHour == null || endHour == null || interval == null) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const data = {
            timezone,
            startHour,
            endHour,
            interval,
            lastNotifiedAt: null,
            user: { connect: { id: userId } },
        };

        if (existing) {
            await prisma.hydrationReminder.update({
                where: { userId },
                data,
            });
            res.json({ message: "Hydration reminder updated" });
        } else {
            await prisma.hydrationReminder.create({ data });
            res.json({ message: "Hydration reminder created" });
        }
    } catch (error) {
        console.error("Error managing hydration reminder:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


module.exports = { getUserData, updateUser, changePassword, deleteUser, changePicture, setHydrationReminder };
