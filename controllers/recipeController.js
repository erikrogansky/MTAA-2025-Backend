const { format, formatDistanceToNow, differenceInDays } = require('date-fns');
const { notifyRecipeUpdate } = require("../socket-manager");
const { prisma } = require("../db");

// Function to create or update a recipe
const createRecipe = async (req, res) => {
    try {
        const { recipeId, title, tags, ingredients, instructions, isPublic, description, details, country } = req.body;

        const isPublicBoolean = isPublic === 'true'; 

        const coverPhoto = req.files.coverPhoto ? req.files.coverPhoto[0].filename : null;
        const imagePaths = req.files['images[]'] ? req.files['images[]'].map(file => file.filename) : [];

        const userId = req.user.id;
        const tagArray = tags.split(',');

        const tagRecords = await prisma.tag.findMany({
            where: {
                name: {
                    in: tagArray
                }
            }
        });

        let recipe;

        if (recipeId) {
            const parsedRecipeId = parseInt(recipeId, 10);
            if (isNaN(parsedRecipeId)) {
                return res.status(400).json({ message: 'Invalid recipe ID' });
            }

            const existingRecipe = await prisma.recipe.findUnique({
                where: { id: parsedRecipeId },
            });

            if (!existingRecipe) {
                return res.status(404).json({ message: 'Recipe not found' });
            }

            if (existingRecipe.userId !== userId) {
                return res.status(403).json({ message: 'You can only update your own recipes' });
            }
            
            await prisma.recipe.update({
                where: { id: parsedRecipeId },
                data: {
                    tags: { set: [] }
                }
            });

            await prisma.recipeImage.deleteMany({
                where: { recipeId: parsedRecipeId }
            });

            recipe = await prisma.recipe.update({
                where: { id: parsedRecipeId },
                data: {
                    title,
                    ingredients,
                    instructions,
                    isPublic: isPublicBoolean,
                    coverPhoto,
                    description,
                    details,
                    country: country || null,
                    tags: {
                        connect: tagRecords.map(tag => ({ id: tag.id }))
                    }
                }
            });

            if (imagePaths.length > 0) {
                await prisma.recipeImage.createMany({
                    data: imagePaths.map(image => ({
                        recipeId: recipe.id,
                        imagePath: image,
                    })),
                });
            }

            notifyRecipeUpdate(parsedRecipeId);

            res.status(200).json({
                message: 'Recipe updated successfully',
                recipe
            });
        } else {
            recipe = await prisma.recipe.create({
                data: {
                    title,
                    ingredients,
                    instructions,
                    isPublic: isPublicBoolean, 
                    coverPhoto,
                    description,
                    details,
                    country: country || null,
                    userId,
                    tags: {
                        connect: tagRecords.map(tag => ({ id: tag.id })) 
                    }
                },
            });

            if (imagePaths.length > 0) {
                await prisma.recipeImage.createMany({
                    data: imagePaths.map(image => ({
                        recipeId: recipe.id,
                        imagePath: image,
                    })),
                });
            }

            res.status(201).json({
                message: 'Recipe created successfully',
                recipe
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while saving the recipe', error: error.message });
    }
};

// Function to get all recipes created by the user
const getAllOwnRecipes = async (req, res) => {
    try {
        const userId = req.user.id;

        const recipes = await prisma.recipe.findMany({
            where: {
                userId: userId,
            },
            select: {
                id: true,
                coverPhoto: true,
                title: true,
                details: true,
                tags: {
                    take: 1,
                },
                reviews: {
                    select: {
                        rating: true,
                    }
                }
            },
        });
        

        const recipesWithFormattedData = recipes.map(recipe => {
            const { prepTime, difficulty, servings, calories } = extractDetails(recipe.details);
            const coverPhotoUrl = recipe.coverPhoto
                ? `${process.env.SERVER_URL}/recipe-images/${recipe.coverPhoto}`
                : null;

            const reviews = Array.isArray(recipe.reviews) ? recipe.reviews : [];
            const overallRating = reviews.length
              ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
              : 0;
            const formattedRating = Math.round(overallRating);
              
        
            return {
                id: recipe.id,
                title: recipe.title,
                coverPhotoUrl: coverPhotoUrl,
                prepTime: prepTime,
                difficulty: difficulty,
                servings: servings,
                calories: calories,
                firstTag: recipe.tags.length > 0 ? recipe.tags[0] : null,
                overallRating: formattedRating,
            };
        });        

        res.status(200).json({
            recipes: recipesWithFormattedData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching recipes', error: error.message });
    }
};

// Function to get all public recipes
const getPublicRecipes = async (req, res) => {
    try {
        const recipes = await prisma.recipe.findMany({
            where: {
                isPublic: true,
            },
            select: {
                id: true,
                coverPhoto: true,
                title: true,
                details: true,
                country: true,
                tags: {
                    take: 1,
                },
                reviews: {
                    select: {
                        rating: true,
                    }
                }
            },
        });

        const recipesWithFormattedData = recipes.map(recipe => {
            const { prepTime, difficulty, servings, calories } = extractDetails(recipe.details);
            const coverPhotoUrl = recipe.coverPhoto
                ? `${process.env.SERVER_URL}/recipe-images/${recipe.coverPhoto}`
                : null;

            const reviews = Array.isArray(recipe.reviews) ? recipe.reviews : [];
            const overallRating = reviews.length
              ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
              : 0;
            const formattedRating = Math.round(overallRating);
        
            return {
                id: recipe.id,
                title: recipe.title,
                coverPhotoUrl: coverPhotoUrl,
                prepTime: prepTime,
                difficulty: difficulty,
                servings: servings,
                calories: calories,
                firstTag: recipe.tags.length > 0 ? recipe.tags[0] : null,
                overallRating: formattedRating,
                country: recipe.country,

            };
        });

        res.status(200).json({
            recipes: recipesWithFormattedData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching public recipes', error: error.message });
    }
};

// Function to extract details from the recipe details string
const extractDetails = (details) => {
    let prepTime = null;
    let difficulty = null;
    let servings = null;
    let calories = null;

    const prepTimeMatch = details.match(/prepTime:\s*(\d+\.?\d*)/);
    const difficultyMatch = details.match(/difficulty:\s*(\w+)/);

    if (prepTimeMatch) {
        prepTime = prepTimeMatch[1];
    }

    if (difficultyMatch) {
        difficulty = difficultyMatch[1];
    }

    const servingsMatch = details.match(/servings:\s*(\d+\.?\d*)/);
    if (servingsMatch) {
        servings = servingsMatch[1];
    }
    const caloriesMatch = details.match(/calories:\s*(\d+\.?\d*)/);
    if (caloriesMatch) {
        calories = caloriesMatch[1];
    }

    return { prepTime, difficulty, servings, calories };
};

// Function to get a complete recipe by ID
const getRecipeById = async (req, res) => {
    try {
        const recipeId = parseInt(req.params.id, 10);

        if (isNaN(recipeId)) {
            return res.status(400).json({ message: 'Invalid recipe ID' });
        }

        const recipe = await prisma.recipe.findUnique({
            where: {
                id: recipeId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profilePicture: true,
                    }
                },
                tags: true,
                images: true,
                reviews: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                profilePicture: true,
                            }
                        }
                    }
                }
            }
        });

        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        if (!recipe.isPublic && recipe.userId !== req.user.id) {
            return res.status(403).json({ message: 'You do not have permission to view this recipe' });
        }

        const { prepTime, difficulty, servings, calories } = extractDetails(recipe.details);
        const coverPhotoUrl = recipe.coverPhoto
            ? `${process.env.SERVER_URL}/recipe-images/${recipe.coverPhoto}`
            : null;

        const imageUrls = recipe.images.map(img => `${process.env.SERVER_URL}/recipe-images/${img.imagePath}`);

        const ingredients = parseIngredients(recipe.ingredients);

        const formattedRecipe = {
            id: recipe.id,
            title: recipe.title,
            ingredients: ingredients,
            instructions: recipe.instructions.split('\n').map(step => step.trim()).filter(step => step.length > 0),
            isPublic: recipe.isPublic,
            description: recipe.description,
            prepTime,
            difficulty,
            servings,
            calories,
            coverPhotoUrl,
            tags: recipe.tags,
            images: imageUrls,
            reviews: recipe.reviews.map(review => ({
                rating: review.rating,
                text: review.text,
                user: {
                    name: review.user.name,
                    profilePictureUrl: review.user.profilePicture ? `${process.env.SERVER_URL}/profile-pictures/${review.user.profilePicture}` : null,
                },
                createdAt: getRelativeDate(review.createdAt),
            })),
            isOwn: recipe.userId === req.user.id,
            country: recipe.country,
        };

        res.status(200).json({ recipe: formattedRecipe });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch recipe', error: error.message });
    }
};

// Function to get a relative date string
function getRelativeDate(createdAt) {
    const daysDiff = differenceInDays(new Date(), createdAt);
  
    if (daysDiff <= 7) {
      return formatDistanceToNow(createdAt, { addSuffix: true });
    }
  
    return format(createdAt, 'MM/dd/yyyy');
  }

// Function to parse ingredients string into an array of objects
const parseIngredients = (ingredientsStr) => {
    const ingredientsList = ingredientsStr.split(',');
    const ingredients = [];

    for (let i = 0; i < ingredientsList.length; i += 3) {
        const icon = ingredientsList[i].trim();
        const name = ingredientsList[i + 1].trim();
        const quantity = ingredientsList[i + 2].trim();

        ingredients.push({
            icon: icon,
            name: name,
            quantity: quantity,
        });
    }

    return ingredients;
};

// Function to add a review to a recipe
const addReview = async (req, res) => {
    try {
        const { recipeId, rating, comment } = req.body;

        await prisma.recipeRating.create({
            data: {
                recipeId,
                userId: req.user.id,
                rating,
                text: comment,
            },
        });

        notifyRecipeUpdate(recipeId);

        res.status(201).json({ message: 'Review added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add review', error: error.message });
    }
};

module.exports = { createRecipe, getAllOwnRecipes, getPublicRecipes, getRecipeById, addReview };
