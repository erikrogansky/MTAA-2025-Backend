const jwt = require("jsonwebtoken");
const { pool, prisma } = require("../db");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const session = await prisma.session.findUnique({
            where: { userId: decoded.userId },
            include: { user: true }
        });

        if (!session || session.refreshToken !== token || new Date(session.expiresAt) < new Date()) {
            return res.status(401).json({ message: "Unauthorized: Invalid session" });
        }

        req.user = session.user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

module.exports = authMiddleware;
