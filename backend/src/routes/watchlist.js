const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const dhanService = require('../services/dhanService');
const Watchlist = require('../models/Watchlist');

router.use(authMiddleware);

// GET /api/watchlist
router.get('/', async (req, res) => {
    try {
        const items = await Watchlist.find({ user: req.userId }).sort({ createdAt: -1 }).lean();
        if (!items.length) {
            return res.json({ success: true, data: [] });
        }
        const marketData = await dhanService.getLiveMarketData();
        if (marketData.success) {
            const { stocks, indices } = marketData.data;
            const enriched = items.map(w => {
                const match = stocks.find(s => s.symbol === w.symbol) || indices.find(i => i.symbol === w.symbol);
                return { ...w, market: match || null };
            });
            return res.json({ success: true, data: enriched });
        }
        res.json({ success: true, data: items });
    } catch (err) {
        console.error('Watchlist fetch error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST /api/watchlist
router.post('/', async (req, res) => {
    try {
        const { symbol, exchange = 'NSE_EQ' } = req.body;
        if (!symbol) return res.status(400).json({ success: false, message: 'Symbol required' });
        const upper = symbol.toUpperCase();
        const existing = await Watchlist.findOne({ user: req.userId, symbol: upper });
        if (existing) return res.status(400).json({ success: false, message: 'Already in watchlist' });
        const created = await Watchlist.create({ user: req.userId, symbol: upper, exchange });
        res.json({ success: true, data: created });
    } catch (err) {
        console.error('Watchlist add error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// DELETE /api/watchlist/:symbol
router.delete('/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const upper = symbol.toUpperCase();
        const result = await Watchlist.deleteOne({ user: req.userId, symbol: upper });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'Removed' });
    } catch (err) {
        console.error('Watchlist delete error:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router;