const express = require('express');
const { getUserData, updateMode } = require('../controllers/userController');

const router = express.Router();

router.get('/get-data', getUserData);
router.post('/update-mode', updateMode);

module.exports = router;