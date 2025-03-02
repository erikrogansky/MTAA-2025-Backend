const express = require('express');
const { testAi, recipeDetails, recipeDescription } = require('../controllers/aiController');

const router = express.Router();

router.get('/', testAi);

router.get('/recipe-details', recipeDetails);
router.get('/recipe-description', recipeDescription);

module.exports = router;