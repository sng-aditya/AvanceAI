const express = require('express');
const router = express.Router();
const dhanService = require('../services/dhanService');
const authMiddleware = require('../middleware/auth');

// All market data routes require authentication
router.use(authMiddleware);

// Test Dhan API connection
router.get('/test-connection', async (req, res) => {
    try {
        const result = await dhanService.testConnection();
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Dhan API connection successful',
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Dhan API connection failed',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get comprehensive market data (OHLC)
router.get('/live-data', async (req, res) => {
    try {
        const result = await dhanService.getLiveMarketData();
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                timestamp: result.timestamp
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch market data',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get Last Traded Prices only
router.get('/ltp', async (req, res) => {
    try {
        const result = await dhanService.getLTPData();
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                timestamp: result.timestamp
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch LTP data',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get market summary for dashboard
router.get('/summary', async (req, res) => {
    try {
        const result = await dhanService.getMarketSummary();
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                timestamp: result.data.timestamp
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch market summary',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get specific stock data
router.get('/stock/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const result = await dhanService.getLiveMarketData();
        
        if (result.success) {
            const stock = result.data.stocks.find(s => s.symbol === symbol.toUpperCase());
            
            if (stock) {
                res.json({
                    success: true,
                    data: stock,
                    timestamp: result.timestamp
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: `Stock ${symbol} not found`
                });
            }
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch stock data',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get indices data
router.get('/indices', async (req, res) => {
    try {
        const result = await dhanService.getLiveMarketData();
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data.indices,
                timestamp: result.timestamp
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch indices data',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get account balance
router.get('/balance', async (req, res) => {
    try {
        const result = await dhanService.checkAccountBalance();
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch account balance',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching balance',
            error: error.message
        });
    }
});

// Place order
router.post('/order', async (req, res) => {
    try {
        const { symbol, quantity, orderType, price } = req.body;
        
        if (!symbol || !quantity || !orderType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: symbol, quantity, orderType'
            });
        }

        // Check if symbol is supported
        const securityId = dhanService.getSecurityId(symbol);
        if (!securityId) {
            return res.status(400).json({
                success: false,
                message: `Symbol ${symbol} is not supported. Supported symbols: ${Object.keys(dhanService.SECURITY_DATA?.NSE_EQ || {}).join(', ')}`
            });
        }

        const result = await dhanService.placeOrder({
            symbol,
            quantity: parseInt(quantity),
            orderType,
            price: price ? parseFloat(price) : null,
            userId: req.userId
        });
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                message: 'Order submitted successfully'
            });
        } else {
            console.error('Order placement error:', result);
            res.json({
                success: false,
                message: result.error || 'Order rejected by exchange',
                errorDetails: result.errorDetails || { message: result.error },
                data: result.data || null
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error while placing order',
            error: error.message
        });
    }
});

// Get order history with detailed failure analysis
router.get('/orders', async (req, res) => {
    try {
        const result = await dhanService.getOrderHistory(req.userId);
        
        if (result.success) {
            const orders = result.data;
            const failedOrders = orders.filter(o => o.status === 'REJECTED' || o.status === 'FAILED' || o.status === 'ERROR');
            const failureReasons = {};
            
            failedOrders.forEach(order => {
                if (order.failureAnalysis?.category) {
                    failureReasons[order.failureAnalysis.category] = (failureReasons[order.failureAnalysis.category] || 0) + 1;
                }
            });
            
            res.json({
                success: true,
                data: orders,
                summary: {
                    total: orders.length,
                    successful: orders.filter(o => o.status === 'COMPLETE' || o.status === 'PENDING').length,
                    failed: failedOrders.length,
                    failureReasons: failureReasons
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch order history',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching orders',
            error: error.message
        });
    }
});

// Get specific order details
router.get('/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const result = await dhanService.getOrderDetails(orderId, req.userId);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Order not found',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching order details',
            error: error.message
        });
    }
});

// Get expiry dates for index
router.get('/expiry/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        
        const result = await dhanService.getExpiryDates(symbol.toUpperCase());
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch expiry dates',
                error: result.error
            });
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expiry dates',
            error: error.message
        });
    }
});

// Get option chain
router.get('/option-chain/:symbol/:expiry', async (req, res) => {
    try {
        const { symbol, expiry } = req.params;
        
        const result = await dhanService.getOptionChain(symbol.toUpperCase(), expiry);
        
        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch option chain',
                error: result.error
            });
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch option chain',
            error: error.message
        });
    }
});

// Execute algorithm
router.post('/algo/execute', async (req, res) => {
    try {
        const { algorithmId, code, language } = req.body;
        
        if (!code || !language) {
            return res.status(400).json({
                success: false,
                message: 'Algorithm code and language are required'
            });
        }

        // Simulate algorithm execution
        const marketData = await dhanService.getLiveMarketData();
        
        if (!marketData.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to fetch market data for algorithm execution'
            });
        }

        // For demo purposes, simulate algorithm decision
        const stocks = marketData.data.stocks;
        const decisions = [];
        
        if (language === 'python') {
            // Simulate Python algorithm execution
            for (const stock of stocks.slice(0, 3)) {
                if (stock.changePercent > 2) {
                    decisions.push({
                        action: 'SELL',
                        symbol: stock.symbol,
                        reason: 'Price up > 2%, taking profit',
                        quantity: 1
                    });
                } else if (stock.changePercent < -2) {
                    decisions.push({
                        action: 'BUY',
                        symbol: stock.symbol,
                        reason: 'Price down > 2%, buying dip',
                        quantity: 1
                    });
                }
            }
        } else if (language === 'json') {
            // Simulate JSON config execution
            try {
                const config = JSON.parse(code);
                const symbols = config.symbols || [];
                
                for (const symbol of symbols) {
                    const stock = stocks.find(s => s.symbol === symbol);
                    if (stock && Math.abs(stock.changePercent) > 1) {
                        decisions.push({
                            action: stock.changePercent > 0 ? 'SELL' : 'BUY',
                            symbol: stock.symbol,
                            reason: `Config-based decision for ${symbol}`,
                            quantity: config.position_size || 1
                        });
                    }
                }
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid JSON configuration'
                });
            }
        }

        res.json({
            success: true,
            data: {
                algorithmId,
                executionTime: new Date().toISOString(),
                decisions,
                marketDataUsed: stocks.length,
                status: 'executed'
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Algorithm execution failed',
            error: error.message
        });
    }
});

module.exports = router;
