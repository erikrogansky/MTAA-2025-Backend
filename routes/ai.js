const express = require('express');
const { recipeDetails, recipeDescription } = require('../controllers/aiController');

const router = express.Router();

/**
 * @swagger
 * /ai/recipe-details:
 *   post:
 *     tags:
 *       - AI
 *     summary: Analyze recipe and return estimated details
 *     description: Returns estimated cook time, difficulty, portion size, and calorie count based on the given recipe.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: string
 *               instructions:
 *                 type: array
 *                 items:
 *                   type: string
 *           example:
 *             title: "Creamy Garlic Chicken"
 *             ingredients:
 *               - name: "chicken breast"
 *                 quantity: "250 g"
 *               - name: "butter"
 *                 quantity: "2 tablespoons"
 *               - name: "garlic"
 *                 quantity: "4 cloves"
 *               - name: "heavy cream"
 *                 quantity: "1 cup"
 *               - name: "parmesan cheese"
 *                 quantity: "0.5 cup"
 *             instructions:
 *               - "Season chicken and cook in butter until golden."
 *               - "Add garlic, cream, and parmesan; simmer for 10 minutes."
 *     responses:
 *       200:
 *         description: Recipe analysis returned successfully
 *         content:
 *           application/json:
 *             example:
 *               cook_length: 0.5
 *               difficulty: "moderate"
 *               portions: 2
 *               calories: 1674
 *       400:
 *         description: Recipe data missing or invalid
 *       500:
 *         description: Internal server error
 */
router.post('/recipe-details', recipeDetails);

/**
 * @swagger
 * /ai/recipe-description:
 *   post:
 *     tags:
 *       - AI
 *     summary: Generate a short, appealing recipe description
 *     description: Returns a food-blog style, mouthwatering description of the given recipe under 100 words.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: string
 *               instructions:
 *                 type: array
 *                 items:
 *                   type: string
 *           example:
 *             title: "Creamy Garlic Chicken"
 *             ingredients:
 *               - name: "chicken breast"
 *                 quantity: "250 g"
 *               - name: "butter"
 *                 quantity: "2 tablespoons"
 *               - name: "garlic"
 *                 quantity: "4 cloves"
 *               - name: "heavy cream"
 *                 quantity: "1 cup"
 *               - name: "parmesan cheese"
 *                 quantity: "0.5 cup"
 *             instructions:
 *               - "Season chicken and cook in butter until golden."
 *               - "Add garlic, cream, and parmesan; simmer for 10 minutes."
 *     responses:
 *       200:
 *         description: Recipe description generated successfully
 *         content:
 *           application/json:
 *             example:
 *               description: "Succulent chicken breast seared to golden perfection, then bathed in a rich, garlicky cream sauce..."
 *       400:
 *         description: Recipe data missing or invalid
 *       500:
 *         description: Internal server error
 */
router.post('/recipe-description', recipeDescription);

module.exports = router;