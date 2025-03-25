const { prisma } = require("../db");

const createRecipe = async (req, res) => {
    try {
        const { title, tags, ingredients, instructions, isPublic, description, details } = req.body;

        // Handle file uploads: cover photo and multiple images
        const coverPhoto = req.file ? req.file.filename : null;
        const imagePaths = req.files ? req.files.map(file => file.filename) : [];
        const userId = req.user.id;

        // Find existing tags or create them
        const tagRecords = await prisma.tag.findMany({
            where: {
                name: { in: tags }
            }
        });

        // Create the recipe
        const recipe = await prisma.recipe.create({
            data: {
                title,
                ingredients,
                instructions,
                isPublic,
                coverPhoto,
                description,
                details,
                userId,
                tags: {
                    connect: tagRecords.map(tag => ({ id: tag.id })) // Connect the tags by their IDs
                }
            },
        });

        // If images are uploaded, create records for them in the RecipeImage model
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

module.exports = { createRecipe };