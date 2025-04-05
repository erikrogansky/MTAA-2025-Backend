const { format, formatDistanceToNow, differenceInDays } = require('date-fns');
const { prisma } = require("../db");
const { is } = require('date-fns/locale');

const createRecipe = async (req, res) => {
    try {
        const { title, tags, ingredients, instructions, isPublic, description, details } = req.body;

        console.log('Incoming fields:', req.body);
        console.log('Incoming files:', req.files);

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

        const recipe = await prisma.recipe.create({
            data: {
                title,
                ingredients,
                instructions,
                isPublic: isPublicBoolean, 
                coverPhoto,
                description,
                details,
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
            recipe: recipe,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while creating the recipe', error: error.message });
    }
};


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
                }
            },
        });

        const recipesWithFormattedData = recipes.map(recipe => {
            const { prepTime, difficulty } = extractDetails(recipe.details);
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
        };

        res.status(200).json({ recipe: formattedRecipe });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch recipe', error: error.message });
    }
};

function getRelativeDate(createdAt) {
    const daysDiff = differenceInDays(new Date(), createdAt);
  
    if (daysDiff <= 7) {
      return formatDistanceToNow(createdAt, { addSuffix: true });
    }
  
    return format(createdAt, 'MM/dd/yyyy');
  }

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

        res.status(201).json({ message: 'Review added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add review', error: error.message });
    }
};

module.exports = { createRecipe, getAllOwnRecipes, getRecipeById, addReview, isOwn };
