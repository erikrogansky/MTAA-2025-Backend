
const express = require('express');
const { register, login, oauthLogin, refreshAccessToken, logout, logoutAll } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/oauth", oauthLogin);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", authMiddleware, logout);
router.post("/logout-all", authMiddleware, logoutAll);

module.exports = router;