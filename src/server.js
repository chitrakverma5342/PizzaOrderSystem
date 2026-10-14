const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/support', require('./routes/support'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database (async for sql.js WASM loading) then start
async function start() {
    await initializeDatabase();

    app.listen(PORT, () => {
        console.log(`\n🍕 Pizza Order System running at http://localhost:${PORT}\n`);
    });
}

start().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});

module.exports = app;
