const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const authMiddleware = require('../middleware/auth');
const dhanService = require('../services/dhanService');

const dbPath = path.join(__dirname, '../../database/auth.db');

router.use(authMiddleware);

// Get user's watchlist
router.get('/', (req, res) => {
    const db = new sqlite3.Database(dbPath);
    
    db.all(
        'SELECT * FROM watchlist WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id],
        async (err, rows) => {
            if (err) {
                db.close();
                return res.status(500).json({ success: false, error: err.message });
            }
            
            // Get live prices for watchlist items
            if (rows.length > 0) {
                const marketData = await dhanService.getLiveMarketData();
                if (marketData.success) {
                    const watchlistWithPrices = rows.map(item => {
                        // Check both stocks and indices
                        const stock = marketData.data.stocks.find(s => s.symbol === item.symbol);
                        const index = marketData.data.indices.find(i => i.symbol === item.symbol);
                        const priceData = stock || index;
                        return { ...item, ...priceData };
                    });
                    res.json({ success: true, data: watchlistWithPrices });
                } else {
                    res.json({ success: true, data: rows });
                }
            } else {
                res.json({ success: true, data: [] });
            }
            
            db.close();
        }
    );
});

// Add to watchlist
router.post('/', (req, res) => {
    const { symbol, exchange = 'NSE_EQ' } = req.body;
    const db = new sqlite3.Database(dbPath);
    
    db.run(
        'INSERT INTO watchlist (user_id, symbol, exchange) VALUES (?, ?, ?)',
        [req.user.id, symbol.toUpperCase(), exchange],
        function(err) {
            if (err) {
                db.close();
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(400).json({ success: false, message: 'Stock already in watchlist' });
                }
                return res.status(500).json({ success: false, error: err.message });
            }
            
            res.json({ success: true, message: 'Added to watchlist', id: this.lastID });
            db.close();
        }
    );
});

// Remove from watchlist
router.delete('/:symbol', (req, res) => {
    const { symbol } = req.params;
    const db = new sqlite3.Database(dbPath);
    
    db.run(
        'DELETE FROM watchlist WHERE user_id = ? AND symbol = ?',
        [req.user.id, symbol.toUpperCase()],
        function(err) {
            if (err) {
                db.close();
                return res.status(500).json({ success: false, error: err.message });
            }
            
            if (this.changes === 0) {
                res.status(404).json({ success: false, message: 'Stock not found in watchlist' });
            } else {
                res.json({ success: true, message: 'Removed from watchlist' });
            }
            
            db.close();
        }
    );
});

module.exports = router;