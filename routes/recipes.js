const express = require('express');
const { uploadRecipeImages, logFields } = require('../utils/multerRecipe');
const { createRecipe, getAllOwnRecipes, getPublicRecipes, getRecipeById, addReview } = require('../controllers/recipeController');

const router = express.Router();

/**
 * @swagger
 * /recipes/create:
 *   post:
 *     tags:
 *       - Recipe
 *     summary: Create or update a recipe
 *     description: Creates a new recipe or updates an existing one with optional image uploads.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: The ID of the recipe to update. Omit to create a new recipe.
 *               title:
 *                 type: string
 *                 description: The title of the recipe.
 *               tags:
 *                 type: string
 *                 description: Comma-separated list of tags for categorizing the recipe - must be name of the existing tag or will be ignored.
 *               ingredients:
 *                 type: string
 *                 description: Ingredients list, separated by commas. Example - "emoji_spaghetti,Spaghetti,1 pack,emoji_cheese_wedge,Cheese,250 g"
 *               instructions:
 *                 type: string
 *                 description: Step-by-step instructions for preparing the recipe.
 *               isPublic:
 *                 type: string
 *                 description: Whether the recipe is public or private. (true/false)
 *               description:
 *                 type: string
 *                 description: A short description of the recipe.
 *               details:
 *                 type: string
 *                 description: Detailed description of preparation time, servings, calories, etc.
 *               country:
 *                 type: string
 *                 description: The country of origin of the recipe.
 *               coverPhoto:
 *                 type: string
 *                 format: binary
 *                 description: The cover photo of the recipe.
 *               images[]:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                   description: Additional images for the recipe.
 *           example:
 *             title: "Awesome Spaghetti"
 *             tags: "European"
 *             ingredients: "emoji_spaghetti,Spaghetti,1 pack,emoji_cheese_wedge,Cheese,250 g,emoji_canned_food,Ketchup,To taste,emoji_garlic,Garlic,2 cloves"
 *             instructions: "Cook spaghetti with a bit of salt, add basil, ketchup, salt, pepper, and garlic in a pan, cook it a bit, then add spaghetti and mix on a small fire, Enjoy :)"
 *             isPublic: "true"
 *             description: "Tender spaghetti basks in a rich, creamy sauce, blending melted cheese and a hint of garlic, freshened with basil."
 *             details: "prepTime: 0.25, difficulty: EASY, servings: 4, calories: 1400"
 *             country: "Slovakia"
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Recipe created successfully
 *               recipe: 
 *                 id: 12
 *                 title: "Awesome Spaghetti"
 *                 tags: ["European", "Main Course"]
 *                 coverPhotoUrl: "/recipe-images/1744534349712-m3g0qtykb.jpg"
 *       200:
 *         description: Recipe updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: You can only update your own recipes
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
router.post('/create', logFields, uploadRecipeImages, createRecipe);

/**
 * @swagger
 * /recipes/get-own:
 *   get:
 *     tags:
 *       - Recipe
 *     summary: Get all the recipes created by the authenticated user
 *     description: Returns a list of recipes created by the authenticated user, including details such as preparation time, difficulty, servings, and ratings.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Recipes returned successfully
 *         content:
 *           application/json:
 *             example:
 *               recipes: 
 *                 - id: 12
 *                   title: "Awesome Spaghetti"
 *                   coverPhotoUrl: "SERVERURL/recipe-images/1744534349712-m3g0qtykb.jpg"
 *                   prepTime: "0.25"
 *                   difficulty: "EASY"
 *                   servings: "4"
 *                   calories: "1400"
 *                   firstTag:
 *                      id: 10
 *                      name: "European"
 *                      color: "#FF8C00"
 *                      group: "Cuisine"
 *                      createdAt: "2025-03-15T00:00:00.000Z"
 *                      updatedAt: "2025-03-15T00:00:00.000Z"
 *                   overallRating: 4
 *       500:
 *         description: Failed to fetch recipes
 */
router.get('/get-own', getAllOwnRecipes);

/**
 * @swagger
 * /recipes/get-public:
 *   get:
 *     tags:
 *       - Recipe
 *     summary: Get all public recipes
 *     description: Returns all recipes that are marked as public, including details like preparation time, difficulty, servings, and ratings.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Public recipes returned successfully
 *         content:
 *           application/json:
 *             example:
 *               recipes: 
 *                 - id: 12
 *                   title: "Awesome Spaghetti"
 *                   coverPhotoUrl: "/recipe-images/1744534349712-m3g0qtykb.jpg"
 *                   prepTime: "0.25"
 *                   difficulty: "EASY"
 *                   servings: "4"
 *                   calories: "1400"
 *                   firstTag:
 *                     id: 10
 *                     name: "European"
 *                     color: "#FF8C00"
 *                     group: "Cuisine"
 *                     createdAt: "2025-03-15T00:00:00.000Z"
 *                     updatedAt: "2025-03-15T00:00:00.000Z"
 *                   overallRating: 4
 *                   country: "Slovakia"
 *       500:
 *         description: Failed to fetch public recipes
 */
router.get('/get-public', getPublicRecipes);

/**
 * @swagger
 * /recipes/get-by-id/{id}:
 *   get:
 *     tags:
 *       - Recipe
 *     summary: Get a specific recipe by its ID
 *     description: Returns detailed information about a specific recipe including ingredients, steps, images, tags, and reviews.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the recipe to fetch.
 *     responses:
 *       200:
 *         description: Recipe found successfully
 *         content:
 *           application/json:
 *             example:
 *               recipe:
 *                 id: 13
 *                 title: "Delicious Pancakes"
 *                 ingredients: 
 *                   - icon: "emoji_egg"
 *                     name: "Eggs"
 *                     quantity: "2 large"
 *                   - icon: "emoji_glass_of_milk"
 *                     name: "Milk"
 *                     quantity: "1 cup"
 *                   - icon: "emoji_salt"
 *                     name: "Salt"
 *                     quantity: "pinch"
 *                   - icon: "emoji_cooked_rice"
 *                     name: "Flour"
 *                     quantity: "1 cup"
 *                 instructions: 
 *                   - "Mix everything together so it is smooth"
 *                   - "Make pancakes"
 *                   - "Enjoy :)"
 *                 isPublic: true
 *                 description: "Fluffy, golden-brown pancakes, soft and warm, made with fresh eggs, creamy milk, and a hint of salt. A comforting treat that melts in your mouth. Perfectly smooth batter, cooked to a golden hue, serves as the base for a delightful breakfast or brunch. Serve with maple syrup, fresh fruits, or a sprinkle of powdered sugar for the ultimate indulgence. Enjoy a stack of these airy, light pancakes any time of the day, guaranteed to satisfy your cravings."
 *                 prepTime: "0.5"
 *                 difficulty: "EASY"
 *                 servings: "4"
 *                 calories: "725"
 *                 coverPhotoUrl: "http://localhost:3000/recipe-images/1744534542326-vu3oo1k11.jpg"
 *                 tags:
 *                   - id: 6
 *                     name: "Dessert"
 *                     color: "#1E90FF"
 *                     group: "Meal Type"
 *                     createdAt: "2025-03-15T00:00:00.000Z"
 *                     updatedAt: "2025-03-15T00:00:00.000Z"
 *                   - id: 10
 *                     name: "European"
 *                     color: "#FF8C00"
 *                     group: "Cuisine"
 *                     createdAt: "2025-03-15T00:00:00.000Z"
 *                     updatedAt: "2025-03-15T00:00:00.000Z"
 *                   - id: 14
 *                     name: "Vegetarian"
 *                     color: "#32CD32"
 *                     group: "Dietary Preferences"
 *                     createdAt: "2025-03-15T00:00:00.000Z"
 *                     updatedAt: "2025-03-15T00:00:00.000Z"
 *                   - id: 26
 *                     name: "Quick & Easy"
 *                     color: "#8A2BE2"
 *                     group: "Cooking Method"
 *                     createdAt: "2025-03-15T00:00:00.000Z"
 *                     updatedAt: "2025-03-15T00:00:00.000Z"
 *                   - id: 31
 *                     name: "Kid-Friendly"
 *                     color: "#20B2AA"
 *                     group: "Special Considerations"
 *                     createdAt: "2025-03-15T00:00:00.000Z"
 *                     updatedAt: "2025-03-15T00:00:00.000Z"
 *                 images:
 *                   - "http://localhost:3000/recipe-images/1744534543289-98tq82iwb.jpg"
 *                 reviews:
 *                   - rating: 3
 *                     text: "Good, but quite basic, I needed something more interesting..."
 *                     user:
 *                       name: "Erik Roganský"
 *                       profilePictureUrl: "http://localhost:3000/profile-pictures/17.jpg"
 *                     createdAt: "1 day ago"
 *                   - rating: 5
 *                     text: "Amazing dish!"
 *                     user:
 *                       name: "John Doe"
 *                       profilePictureUrl: "http://localhost:3000/profile-pictures/19.jpg"
 *                     createdAt: "less than a minute ago"
 *                 isOwn: false
 *                 country: "United States"
 *       400:
 *         description: Invalid recipe ID
 *       403:
 *         description: You do not have permission to view this recipe
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
router.get('/get-by-id/:id', getRecipeById);

/**
 * @swagger
 * /recipes/post-review:
 *   post:
 *     tags:
 *       - Recipe
 *     summary: Add a review for a recipe
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipeId:
 *                 type: integer
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *           example:
 *             recipeId: 12
 *             rating: 5
 *             comment: "Amazing dish!"
 *     responses:
 *       201:
 *         description: Review added successfully
 *       500:
 *         description: Failed to add review
 */
router.post('/post-review', addReview);

module.exports = router;
