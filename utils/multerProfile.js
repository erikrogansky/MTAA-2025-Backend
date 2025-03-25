const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage for profile pictures
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../profile_pictures");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Store the profile picture using the user's ID as filename
        cb(null, `${req.user.id}_profile${path.extname(file.originalname)}`);
    }
});

// Set up storage for recipe images
const recipeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../recipe_images");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // For recipe images, generate a unique filename using timestamp and random string
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
        cb(null, filename);
    }
});

// Set up Multer for handling profile picture upload
const uploadProfilePicture = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Adjust file size limit if needed
}).single('profilePicture'); // Profile picture upload (single file)

// Set up Multer for handling recipe image uploads
const uploadRecipeImages = multer({
    storage: recipeStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Adjust file size limit if needed
});

// Export middleware for handling uploads
module.exports = {
    uploadProfilePicture,
    uploadCoverPhoto: uploadRecipeImages.single('coverPhoto'), // Handle single cover photo upload
    uploadMultipleImages: uploadRecipeImages.array('images', 10), // Handle multiple recipe images (up to 10)
};