const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage for recipe images
const recipeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../recipe_images"); // Path to store uploaded images
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true }); // Create folder if it doesn't exist
        }
        cb(null, dir); // Specify folder
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // Get file extension
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`; // Unique filename
        cb(null, filename);
    }
});

// Set up multer instance for uploading recipe images
const uploadRecipeImages = multer({
    storage: recipeStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max file size 5MB
});

// Export middleware for handling single cover photo and multiple images
module.exports = { 
    uploadCoverPhoto: uploadRecipeImages.single('coverPhoto'), // Handle one cover photo
    uploadMultipleImages: uploadRecipeImages.array('images', 10) // Handle up to 10 images
};
