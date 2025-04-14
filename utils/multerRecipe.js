// Multer that saves recipe images to a specific directory
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const recipeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../recipe_images");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
        cb(null, filename);
    }
});

const uploadRecipeImages = multer({
    storage: recipeStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
    { name: 'coverPhoto', maxCount: 1 },
    { name: 'images[]', maxCount: 10 }
]);

module.exports = { uploadRecipeImages };