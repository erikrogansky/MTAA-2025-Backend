const express = require('express');
const { uploadRecipeImages, logFields } = require('../utils/multerRecipe');
const { createRecipe, getAllOwnRecipes, getPublicRecipes, getRecipeById, addReview } = require('../controllers/recipeController');
const { is } = require('date-fns/locale');

const router = express.Router();

router.post('/create', logFields, uploadRecipeImages, createRecipe);
router.get('/get-own', getAllOwnRecipes)
router.get('/get-public', getPublicRecipes);
router.get('/get-by-id/:id', getRecipeById);
router.post('/post-review', addReview);

module.exports = router;
