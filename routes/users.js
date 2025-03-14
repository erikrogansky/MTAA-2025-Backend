const express = require('express');
const { getUserData, updateUser, changePassword, deleteUser } = require('../controllers/userController');

const router = express.Router();

router.get('/get-data', getUserData);
router.put('/update', updateUser);
router.put('/change-password', changePassword);
router.delete('/delete', deleteUser);

module.exports = router;