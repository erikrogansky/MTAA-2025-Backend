const { prisma } = require("../db");

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
        
            return {
                title: recipe.title,
                coverPhotoUrl: coverPhotoUrl,
                prepTime: prepTime,
                difficulty: difficulty,
                firstTag: recipe.tags.length > 0 ? recipe.tags[0] : null,
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

    const prepTimeMatch = details.match(/prepTime:\s*(\d+\.?\d*)/);
    const difficultyMatch = details.match(/difficulty:\s*(\w+)/);

    if (prepTimeMatch) {
        prepTime = prepTimeMatch[1];
    }

    if (difficultyMatch) {
        difficulty = difficultyMatch[1];
    }

    return { prepTime, difficulty };
};

module.exports = { createRecipe, getAllOwnRecipes };
