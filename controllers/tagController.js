const { prisma } = require("../db");

const getAll = async (req, res) => {
    try {
        const tags = await prisma.tag.findMany({
            select: {
                name: true,
                color: true,
            },
        });

        res.json(tags);
    } catch (error) {
        console.error("Error fetching tags:", error);
        res.status(500).json({ error: "Failed to fetch tags" });
    }
};

module.exports = { getAll };
