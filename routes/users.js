const express = require('express');
const { getUserData, updateUser, changePassword, deleteUser, changePicture } = require('../controllers/userController');

const router = express.Router();

router.get('/get-data', getUserData);
router.put('/update', updateUser);
router.put('/change-password', changePassword);
router.delete('/delete', deleteUser);
router.put('/change-picture', changePicture);

module.exports = router;