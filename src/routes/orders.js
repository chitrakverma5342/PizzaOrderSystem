const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { calculateSubtotal, validateCoupon, calculateTotal } = require('../utils/pricing');

/**
 * POST /api/orders
 * Place a new order.
 * Body: { customer_name, customer_email?, phone, address, items: [{id, name, price, quantity}], coupon_code? }
 */
router.post('/', (req, res) => {
    try {
        const { customer_name, customer_email, phone, address, items, coupon_code } = req.body;

        // Validate required fields
        if (!customer_name || !phone || !address) {
            return res.status(400).json({
                success: false,
                error: 'customer_name, phone, and address are required',
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'items must be a non-empty array',
            });
        }

        // Calculate pricing
        const total_price = calculateSubtotal(items);

        let discount = 0;
        let final_price = total_price;
        let appliedCoupon = coupon_code || null;

        if (coupon_code) {
            const couponResult = validateCoupon(coupon_code);
            if (couponResult.valid) {
                const totals = calculateTotal(total_price, couponResult.discount_percent);
                discount = totals.discount;
                final_price = totals.final_price;
            } else {
                appliedCoupon = null; // Don't store invalid coupons
            }
        }

        // Insert into database
        const db = getDatabase();
        const result = db.prepare(`
            INSERT INTO orders (customer_name, customer_email, phone, address, items, total_price, coupon_code, discount, final_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            customer_name,
            customer_email || null,
            phone,
            address,
            JSON.stringify(items),
            total_price,
            appliedCoupon,
            discount,
            final_price
        );

        // Fetch the created order
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
        order.items = JSON.parse(order.items);

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/orders
 * List orders, optionally filtered by ?email=
 */
router.get('/', (req, res) => {
    try {
        const db = getDatabase();
        const { email } = req.query;

        let orders;
        if (email) {
            orders = db.prepare('SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC').all(email);
        } else {
            orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
        }

        // Parse items JSON string back to array for each order
        const parsed = orders.map(order => ({
            ...order,
            items: JSON.parse(order.items),
        }));

        res.json({ success: true, data: parsed });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/orders/:id
 * Get a single order by ID.
 */
router.get('/:id', (req, res) => {
    try {
        const db = getDatabase();
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        order.items = JSON.parse(order.items);
        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PATCH /api/orders/:id/status
 * Update order status.
 * Body: { status: 'pending' | 'confirmed' | 'delivered' }
 */
router.patch('/:id/status', (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'delivered'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `status must be one of: ${validStatuses.join(', ')}`,
            });
        }

        const db = getDatabase();
        const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
        order.items = JSON.parse(order.items);

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
