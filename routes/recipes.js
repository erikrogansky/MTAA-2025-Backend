const express = require('express');
const { uploadRecipeImages, logFields } = require('../utils/multerRecipe');
const { createRecipe, getAllOwnRecipes } = require('../controllers/recipeController');

const router = express.Router();

router.post('/create', logFields, uploadRecipeImages, createRecipe);
router.get('/get-own', getAllOwnRecipes)

module.exports = router;
