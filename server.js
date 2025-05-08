require("dotenv").config();
const path = require("path");
const express = require("express");
const usersRoutes = require("./routes/users");
const aiRoutes = require("./routes/ai");
const authRoutes = require("./routes/auth");
const tagRoutes = require("./routes/tags");
const recipeRoutes = require("./routes/recipes");
const errorHandler = require("./middleware/errorHandler");
const authMiddleware = require("./middleware/authMiddleware");
const { initializeWebSocket } = require("./socket");
const setupSwagger = require('./swagger');
const { startHydrationCron } = require("./utils/reminders");

const PORT = process.env.PORT || 3000;
const app = express();
setupSwagger(app);

app.use(express.json());
app.use(errorHandler);

// Routes are handled via route files in the routes directory
app.use("/auth", authRoutes);
app.use("/users", authMiddleware, usersRoutes);
app.use("/ai", authMiddleware, aiRoutes);
app.use("/tags", authMiddleware, tagRoutes);
app.use("/recipes", authMiddleware, recipeRoutes);

// Static serving of images
app.use("/profile-pictures", express.static(path.join(__dirname, "profile_pictures")));
app.use("/recipe-images", express.static(path.join(__dirname, "recipe_images")));


const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

startHydrationCron();

initializeWebSocket(server);