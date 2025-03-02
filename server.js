require("dotenv").config();
const express = require("express");
const usersRoutes = require("./routes/users");
const aiRoutes = require("./routes/ai");
const errorHandler = require("./middleware/errorHandler");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(errorHandler);

app.get("/", (req, res) => {
    res.json({ message: "Hello, Node.js Server!" });
});

app.use("/users", authMiddleware, usersRoutes);
app.use("/ai", authMiddleware, aiRoutes)

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});