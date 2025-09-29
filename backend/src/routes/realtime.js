const express = require('express');
const router = express.Router();

// Test endpoint without auth
router.get('/test', (req, res) => {
    try {
        const websocketService = require('../services/websocketService');
        const data = websocketService.getMarketData();
        
        res.json({
            success: true,
            connected: websocketService.isConnected,
            data,
            timestamp: new Date().toISOString(),
            source: 'websocket_realtime'
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            connected: false
        });
    }
});

// Real-time market data
router.get('/market-data', (req, res) => {
    try {
        const websocketService = require('../services/websocketService');
        const data = websocketService.getMarketData();
        
        res.json({
            success: true,
            data,
            timestamp: new Date().toISOString(),
            latency: '<1s',
            updateFrequency: 'real-time'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;