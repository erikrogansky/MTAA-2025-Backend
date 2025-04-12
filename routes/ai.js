const express = require('express');
const { testAi, recipeDetails, recipeDescription } = require('../controllers/aiController');

const router = express.Router();

router.post('/', testAi);

router.post('/recipe-details', recipeDetails);
router.post('/recipe-description', recipeDescription);

module.exports = router;