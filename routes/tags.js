const express = require('express');
const { getAll } = require('../controllers/tagController');

const router = express.Router();

/**
 * @swagger
 * /tags/get-all:
 *   get:
 *     tags:
 *       - Tag
 *     summary: Get all tags
 *     description: Returns a list of all tags with name, color, and group fields.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of tags retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               - name: "UX"
 *                 color: "#FF5733"
 *                 group: "category"
 *               - name: "Accessibility"
 *                 color: "#33B5FF"
 *                 group: "feature"
 *       500:
 *         description: Failed to fetch tags
 */
router.get('/get-all', getAll);

module.exports = router;