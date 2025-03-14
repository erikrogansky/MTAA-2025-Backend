const express = require('express');
const { getUserData, updateUser } = require('../controllers/userController');

const router = express.Router();

router.get('/get-data', getUserData);
router.post('/update', updateUser);

module.exports = router;