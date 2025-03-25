const express = require('express');
const { uploadCoverPhoto, uploadMultipleImages } = require('../utils/multerRecipe');
const { createRecipe } = require('../controllers/recipeController');

const router = express.Router();
router.post('/create', uploadCoverPhoto, uploadMultipleImages, createRecipe);

module.exports = router;