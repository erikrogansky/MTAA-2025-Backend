const express = require('express');
const { getUserData, updateMode } = require('../controllers/userController');

const router = express.Router();

router.get('/get-data', getUserData);
router.get('/update-mode', updateMode);

module.exports = router;