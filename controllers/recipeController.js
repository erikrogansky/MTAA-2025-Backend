

import { prisma } from "../db";

const createRecipe = async (req, res) => {
    try {
        const { title, tags, ingredients, instructions, isPublic, description, details } = req.body;

        const coverPhoto = req.file ? req.file.filename : null; 

        const imagePaths = req.files ? req.files.map(file => file.filename) : []; 

        const userId = req.user.id; 

        const recipe = await prisma.recipe.create({
            data: {
                title,
                tags,
                ingredients,
                instructions,
                isPublic,
                coverPhoto,
                description,
                details,
                userId,
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

exports.module = { createRecipe };