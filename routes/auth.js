const express = require('express');
const { register, login, oauthLogin, refreshAccessToken, logout, logoutAll } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     description: Creates a new user and returns the access token and refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the user
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               preferences:
 *                 type: array
 *                 items:
 *                   type: string
 *               deviceId:
 *                 type: string
 *             required:
 *               - name
 *               - email
 *               - password
 *               - deviceId
 *           example:
 *             name: "John Doe"
 *             email: "john.doe@example.com"
 *             password: "Str0ngP@ssword!"
 *             deviceId: "a1b2c3d4e5f6"
 *     responses:
 *       201:
 *         description: Successfully created user and generated tokens
 *         content:
 *           application/json:
 *             example:
 *               accessToken: "yourAccessToken"
 *               refreshToken: "yourRefreshToken"
 *       400:
 *         description: Missing or invalid input data
 *       500:
 *         description: Internal server error
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login a user
 *     description: Login with email and password, and return access and refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *               deviceId:
 *                 type: string
 *                 description: Unique ID of the user's device
 *               firebaseToken:
 *                 type: string
 *                 description: Firebase token for push notifications
 *             required:
 *               - email
 *               - password
 *               - deviceId
 *           example:
 *             email: "john.doe@example.com"
 *             password: "Str0ngP@ssword!"
 *             deviceId: "a1b2c3d4e5f6"
 *     responses:
 *       200:
 *         description: Successfully logged in and generated tokens
 *         content:
 *           application/json:
 *             example:
 *               accessToken: "yourAccessToken"
 *               refreshToken: "yourRefreshToken"
 *       400:
 *         description: Invalid credentials or missing data
 *       500:
 *         description: Internal server error
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/oauth:
 *   post:
 *     tags:
 *     - Auth
 *     summary: Login using OAuth
 *     description: Login via an OAuth provider (like Google, Facebook) and return access and refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *               deviceId:
 *                 type: string
 *               firebaseToken:
 *                 type: string
 *               provider:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in via OAuth and generated tokens
 *         content:
 *           application/json:
 *             example: { "accessToken": "yourAccessToken", "refreshToken": "yourRefreshToken" }
 *       400:
 *         description: Missing or invalid OAuth data
 *       500:
 *         description: Internal server error
 */
router.post("/oauth", oauthLogin);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refresh the access token using the refresh token
 *     description: Use a valid refresh token to get a new access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token issued during login
 *               deviceId:
 *                 type: string
 *                 description: Unique ID of the user's device
 *             required:
 *               - refreshToken
 *               - deviceId
 *           example:
 *             refreshToken: "yourRefreshToken"
 *             deviceId: "a1b2c3d4e5f6"
 *     responses:
 *       200:
 *         description: Successfully refreshed access token
 *         content:
 *           application/json:
 *             example:
 *               accessToken: "yourNewAccessToken"
 *       401:
 *         description: Invalid refresh token
 *       403:
 *         description: Forbidden – invalid or expired session
 *       500:
 *         description: Internal server error
 */
router.post("/refresh-token", refreshAccessToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout from a single device
 *     description: Logout from the current device by invalidating the refresh token.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token to invalidate
 *               deviceId:
 *                 type: string
 *                 description: ID of the device to log out
 *             required:
 *               - refreshToken
 *               - deviceId
 *           example:
 *             refreshToken: "yourRefreshToken"
 *             deviceId: "a1b2c3d4e5f6"
 *     responses:
 *       200:
 *         description: Successfully logged out from the device
 *         content:
 *           application/json:
 *             example:
 *               message: "Logged out from this device"
 *       400:
 *         description: Missing or invalid refresh token
 *       401:
 *         description: Unauthorized, invalid session or expired token
 *       500:
 *         description: Internal server error
 */
router.post("/logout", authMiddleware, logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout from all devices
 *     description: Invalidate all refresh tokens and logout from all devices for the user.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: A valid refresh token to identify the user session
 *             required:
 *               - refreshToken
 *           example:
 *             refreshToken: "yourRefreshToken"
 *     responses:
 *       200:
 *         description: Successfully logged out from all devices
 *         content:
 *           application/json:
 *             example:
 *               message: "Logged out from all devices"
 *       400:
 *         description: Missing or invalid refresh token
 *       401:
 *         description: Unauthorized, invalid session or expired token
 *       500:
 *         description: Internal server error
 */
router.post("/logout-all", authMiddleware, logoutAll);

module.exports = router;
