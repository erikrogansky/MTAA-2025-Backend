const express = require('express');
const { getUserData, updateUser, changePassword, deleteUser, changePicture, setHydrationReminder } = require('../controllers/userController');
const { upload } = require('../utils/multerProfile');

const router = express.Router();

/**
 * @swagger
 * /users/get-data:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user data
 *     description: Returns detailed user data including connected OAuth accounts, preferences, and profile picture URL.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               name: "John Doe"
 *               hasPassword: true
 *               hasFacebookAuth: false
 *               hasGoogleAuth: true
 *               darkMode: "y"
 *               profilePictureUrl: "SERVERURL/profile-pictures/123.jpg"
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/get-data', getUserData);

/**
 * @swagger
 * /users/update:
 *   put:
 *     tags:
 *       - User
 *     summary: Update user data
 *     description: Allows updating name, profile picture and dark mode preference.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *               mode:
 *                 type: string
 *                 enum: ["y", "n", "s"]
 *               preferences:
 *                 type: array
 *                 items:
 *                   type: string
 *           example:
 *             name: "Jane Doe"
 *             profilePicture: "jane.jpg"
 *             mode: "n"
 *             preferences: []
 *     responses:
 *       200:
 *         description: User data updated
 *         content:
 *           application/json:
 *             example:
 *               message: "User data updated"
 *               updatedFields:
 *                 name: "Jane Doe"
 *       400:
 *         description: No valid fields provided
 *       500:
 *         description: Internal server error
 */
router.put('/update', updateUser);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     tags:
 *       - User
 *     summary: Change user password
 *     description: Changes the password. If a password already exists, current password is required.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *             required:
 *               - newPassword
 *           example:
 *             currentPassword: "OldP@ss123"
 *             newPassword: "NewStr0ngP@ssword!"
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Current password incorrect
 *       500:
 *         description: Internal server error
 */
router.put('/change-password', changePassword);

/**
 * @swagger
 * /users/delete:
 *   delete:
 *     tags:
 *       - User
 *     summary: Delete user account
 *     description: Deletes the currently authenticated user's account.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted
 *         content:
 *           application/json:
 *             example:
 *               message: "User deleted"
 *       500:
 *         description: Internal server error
 */
router.delete('/delete', deleteUser);

/**
 * @swagger
 * /users/change-picture:
 *   post:
 *     tags:
 *       - User
 *     summary: Upload or change profile picture
 *     description: Uploads a new profile picture for the user. Expects a single image file as multipart/form-data.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated
 *         content:
 *           application/json:
 *             example:
 *               message: "Profile picture updated"
 *               imageUrl: "123.jpg"
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Internal server error
 */
router.post('/change-picture', upload.single('file'), changePicture);

router.post('/set-hydration-reminder', setHydrationReminder);

module.exports = router;