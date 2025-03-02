
const express = require('express');
const { register, login, refreshAccessToken, logout, logoutAll } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", authMiddleware, refreshAccessToken);
router.post("/logout", authMiddleware, logout);
router.post("/logout-all", authMiddleware, logoutAll);

module.exports = router;