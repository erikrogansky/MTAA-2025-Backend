const express = require('express');
const { uploadRecipeImages, logFields } = require('../utils/multerRecipe');
const { createRecipe, getAllOwnRecipes, getRecipeById } = require('../controllers/recipeController');

const router = express.Router();

router.post('/create', logFields, uploadRecipeImages, createRecipe);
router.get('/get-own', getAllOwnRecipes)
router.get('/get-by-id/:id', getRecipeById);

module.exports = router;
