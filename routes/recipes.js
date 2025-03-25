const express = require('express');
const { uploadRecipeImages, logFields } = require('../utils/multerRecipe');
const { createRecipe } = require('../controllers/recipeController');

const router = express.Router();

router.post('/create', logFields, uploadRecipeImages, createRecipe);

module.exports = router;
