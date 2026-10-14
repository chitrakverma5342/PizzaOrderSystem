const express = require('express');
const router = express.Router();

/**
 * POST /api/support
 * Submit customer support inquiry
 * Body: { name, email, subject, message }
 */
router.post('/', (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'name, email, subject, and message are required',
            });
        }

        const ticketId = 'TICK-' + Math.floor(100000 + Math.random() * 900000);

        res.status(200).json({
            success: true,
            data: {
                ticket_id: ticketId,
                name,
                email,
                subject,
                message,
                received_at: new Date().toISOString(),
                response_estimate: 'Within 15 minutes',
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
