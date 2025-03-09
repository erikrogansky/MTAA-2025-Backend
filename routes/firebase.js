const express = require('express');
const { updateFirebaseToken } = require('../controllers/firebaseController');

const router = express.Router();

router.get('/send-token', updateFirebaseToken);

module.exports = router;