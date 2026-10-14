const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');

/**
 * GET /api/menu
 * Returns all menu items, optionally filtered by ?category=pizza|sides|drinks
 */
router.get('/', (req, res) => {
    try {
        const db = getDatabase();
        const { category } = req.query;

        let items;
        if (category) {
            items = db.prepare('SELECT * FROM menu_items WHERE category = ?').all(category);
        } else {
            items = db.prepare('SELECT * FROM menu_items').all();
        }

        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/menu/:id
 * Returns a single menu item by ID
 */
router.get('/:id', (req, res) => {
    try {
        const db = getDatabase();
        const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);

        if (!item) {
            return res.status(404).json({ success: false, error: 'Menu item not found' });
        }

        res.json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
