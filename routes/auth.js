const express = require('express');
const { register, login, oauthLogin, refreshAccessToken, logout, logoutAll } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *      - Auth
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
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               preferences:
 *                 type: array
 *                 items:
 *                   type: string
 *               deviceId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully created user and generated tokens
 *         content:
 *           application/json:
 *             example: { "accessToken": "yourAccessToken", "refreshToken": "yourRefreshToken" }
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
 *      - Auth
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
 *               password:
 *                 type: string
 *               deviceId:
 *                 type: string
 *               firebaseToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in and generated tokens
 *         content:
 *           application/json:
 *             example: { "accessToken": "yourAccessToken", "refreshToken": "yourRefreshToken" }
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
 *      - Auth
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
 *               deviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully refreshed access token
 *         content:
 *           application/json:
 *             example: { "accessToken": "yourNewAccessToken" }
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
 *      - Auth
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
 *               deviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged out from the device
 *         content:
 *           application/json:
 *             example: { "message": "Logged out from this device" }
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
 *      - Auth
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
 *     responses:
 *       200:
 *         description: Successfully logged out from all devices
 *         content:
 *           application/json:
 *             example: { "message": "Logged out from all devices" }
 *       400:
 *         description: Missing or invalid refresh token
 *       401:
 *         description: Unauthorized, invalid session or expired token
 *       500:
 *         description: Internal server error
 */
router.post("/logout-all", authMiddleware, logoutAll);

module.exports = router;
