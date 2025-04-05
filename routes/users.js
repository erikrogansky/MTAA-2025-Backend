const express = require('express');
const { getUserData, updateUser, changePassword, deleteUser, changePicture } = require('../controllers/userController');
const { upload } = require('../utils/multerProfile');

const router = express.Router();

/**
 * @swagger
 * /users/get-data:
 *   get:
 *     tags:
 *      - Users
 *     summary: Get user data
 *     description: Retrieve data for the currently authenticated user
 *     security:
 *       - BearerAuth: [] 
 *     responses:
 *       200:
 *         description: Successfully fetched user data
 *         content:
 *           application/json:
 *             example: 
 *               {
 *                 "name": "John Doe",
 *                 "hasPassword": true,
 *                 "hasFacebookAuth": true,
 *                 "hasGoogleAuth": false,
 *                 "darkMode": "y",
 *                 "profilePictureUrl": "http://example.com/profile-pictures/1.jpg"
 *               }
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
 *      - Users
 *     summary: Update user data
 *     description: Update user details such as name, profile picture, dark mode preference, or preferences.
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
 *                 enum: [y, n, s]
 *               preferences:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Successfully updated user data
 *         content:
 *           application/json:
 *             example: { "message": "User data updated", "updatedFields": { "name": "John" } }
 *       400:
 *         description: Invalid input or missing fields
 *       500:
 *         description: Internal server error
 */
router.put('/update', updateUser);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     tags:
 *      - Users
 *     summary: Change user password
 *     description: Change the current password to a new password, with validation of the current password.
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
 *     responses:
 *       200:
 *         description: Successfully changed password
 *       400:
 *         description: Missing or invalid passwords
 *       401:
 *         description: Incorrect current password
 *       500:
 *         description: Internal server error
 */
router.put('/change-password', changePassword);

/**
 * @swagger
 * /users/delete:
 *   delete:
 *     tags:
 *      - Users
 *     summary: Delete user account
 *     description: Permanently delete the currently authenticated user's account.
 *     security:
 *       - BearerAuth: [] 
 *     responses:
 *       200:
 *         description: User account successfully deleted
 *       500:
 *         description: Internal server error
 */
router.delete('/delete', deleteUser);

/**
 * @swagger
 * /users/change-picture:
 *   post:
 *     tags:
 *      - Users
 *     summary: Change profile picture
 *     description: Upload a new profile picture for the authenticated user.
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
 *         description: Successfully updated profile picture
 *         content:
 *           application/json:
 *             example: { "message": "Profile picture updated", "imageUrl": "1.jpg" }
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Internal server error
 */
router.post('/change-picture', upload.single('file'), changePicture);

module.exports = router;