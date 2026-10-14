const express = require('express');
const router = express.Router();
const { validateCoupon } = require('../utils/pricing');

/**
 * POST /api/coupons/validate
 * Validates a coupon code.
 * Body: { code: "WELCOME10" }
 */
router.post('/validate', (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Coupon code is required',
            });
        }

        const result = validateCoupon(code);

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
