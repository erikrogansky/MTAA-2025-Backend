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

        const tagArray = Array.isArray(tags) ? tags : [tags];

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

module.exports = { createRecipe };
