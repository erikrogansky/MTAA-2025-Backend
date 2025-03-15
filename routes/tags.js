const express = require('express');
const { getAll } = require('../controllers/tagController');

const router = express.Router();

router.get('/get-all', getAll);

module.exports = router;