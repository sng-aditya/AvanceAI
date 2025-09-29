const express = require('express');
const router = express.Router();
const dhanService = require('../services/dhanService');
const websocketService = require('../services/websocketService');

// NOTE: Mock data removed intentionally; all responses now require real WebSocket or REST data.
const authMiddleware = require('../middleware/auth');

// All market data routes require authentication
router.use(authMiddleware);

// Test WebSocket connection status
router.get('/websocket-status', async (req, res) => {
    try {
        const wsData = websocketService.getMarketData();
        res.json({
            success: true,
            data: {
                isConnected: websocketService.isConnected,
                stockCount: wsData.stocks.length,
                indicesCount: wsData.indices.length,
                totalCacheItems: websocketService.marketData.size,
                lastUpdate: new Date().toISOString(),
                sampleData: {
                    stocks: wsData.stocks.slice(0, 3),
                    indices: wsData.indices.slice(0, 2)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'WebSocket status check failed',
            error: error.message
        });
    }
});

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

// Get comprehensive market data (REAL-TIME via WebSocket)
router.get('/live-data', async (req, res) => {
    try {
        // Get real-time data from WebSocket cache
        const marketData = websocketService.getMarketData();
        
        if (marketData && (marketData.stocks.length > 0 || marketData.indices.length > 0)) {
            res.json({
                success: true,
                data: {
                    stocks: marketData.stocks,
                    indices: marketData.indices
                },
                timestamp: new Date().toISOString(),
                source: 'websocket'
            });
        } else {
            // Fallback to API if WebSocket data not available
            console.log('⚠️ WebSocket data not available, falling back to API');
            const result = await dhanService.getLiveMarketData();
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    timestamp: result.timestamp,
                    source: 'api_fallback'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to fetch market data',
                    error: result.error
                });
            }
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get Last Traded Prices only (REAL-TIME via WebSocket)
router.get('/ltp', async (req, res) => {
    try {
        // Get real-time LTP data from WebSocket cache
        const marketData = websocketService.getMarketData();
        
        if (marketData && (marketData.stocks.length > 0 || marketData.indices.length > 0)) {
            // Extract only LTP data
            const ltpData = {
                stocks: marketData.stocks.map(stock => ({
                    symbol: stock.symbol,
                    ltp: stock.ltp,
                    change: stock.change,
                    changePercent: stock.changePercent,
                    isPositive: stock.isPositive,
                    timestamp: stock.timestamp
                })),
                indices: marketData.indices.map(index => ({
                    symbol: index.symbol,
                    ltp: index.ltp,
                    change: index.change,
                    changePercent: index.changePercent,
                    isPositive: index.isPositive,
                    timestamp: index.timestamp
                }))
            };
            
            res.json({
                success: true,
                data: ltpData,
                timestamp: new Date().toISOString(),
                source: 'websocket'
            });
        } else {
            // Fallback to API if WebSocket data not available
            console.log('⚠️ WebSocket LTP data not available, falling back to API');
            const result = await dhanService.getLTPData();
            
            if (result.success) {
                res.json({
                    success: true,
                    data: result.data,
                    timestamp: result.timestamp,
                    source: 'api_fallback'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to fetch LTP data',
                    error: result.error
                });
            }
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get market summary for dashboard (REAL-TIME via WebSocket)
router.get('/summary', async (req, res) => {
    // Market summary endpoint
    try {
        // Get real-time market summary from WebSocket cache
        const marketData = websocketService.getMarketData();
        const hasWebSocketData = websocketService.isConnected && marketData && (marketData.stocks.length > 0 || marketData.indices.length > 0);
        
        if (hasWebSocketData) {
            // Using WebSocket data for market summary
            const stocks = marketData.stocks || [];
            const indices = marketData.indices || [];
            
            const totalStocks = stocks.length;
            const gainers = stocks.filter(stock => stock.changePercent > 0).length;
            const losers = stocks.filter(stock => stock.changePercent < 0).length;
            
            const topGainer = stocks.length > 0 ? stocks.reduce((max, stock) => 
                stock.changePercent > max.changePercent ? stock : max, 
                stocks[0]
            ) : null;
            
            const summary = {
                summary: {
                    totalStocks,
                    gainers,
                    losers,
                    topGainer,
                    topLoser: null
                },
                indices: indices.slice(0, 3),
                topStocks: stocks.slice(0, 8),
                timestamp: new Date().toISOString()
            };
            
            res.set({
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.json({
                success: true,
                data: summary,
                timestamp: summary.timestamp,
                source: 'websocket_realtime'
            });
        } else {
            // Only log fallback if WebSocket is supposed to be connected
            if (websocketService.isConnected) {
                console.log('⚠️ WebSocket connected but no market data, falling back to API');
            } else {
                console.log('⚠️ WebSocket not connected, using API');
            }
            const result = await dhanService.getMarketSummary();
            
            if (result.success) {
                res.set({
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                });
                res.json({
                    success: true,
                    data: result.data,
                    timestamp: result.data.timestamp,
                    source: 'api_fallback'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to fetch market summary',
                    error: result.error || 'API temporarily unavailable'
                });
            }
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

// Get positions data
router.get('/positions', async (req, res) => {
    try {
        const result = await dhanService.getPositions();
        
        if (result.success) {
            res.set({
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch positions',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch positions',
            error: error.message
        });
    }
});

// Get holdings data
router.get('/holdings', async (req, res) => {
    try {
        const result = await dhanService.getHoldings();
        
        if (result.success) {
            res.set({
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch holdings',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch holdings',
            error: error.message
        });
    }
});

// Get account balance
router.get('/balance', async (req, res) => {
    try {
        const result = await dhanService.checkAccountBalance();
        
        if (result.success) {
            res.set({
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
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

// Test endpoint for option chain API
router.get('/test-option-chain', async (req, res) => {
    try {
        console.log('Testing option chain API...');
        const result = await dhanService.testOptionChainAPI();
        res.json(result);
    } catch (error) {
        console.error('Test API error:', error);
        res.status(500).json({
            success: false,
            error: 'Test failed: ' + error.message
        });
    }
});

// Get expiry dates for index
router.get('/expiry/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        
        if (!symbol || symbol.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Symbol parameter is required'
            });
        }

        // Fetching expiry dates
        
        const result = await dhanService.getExpiryDates(symbol.trim());
        
        if (result.success) {
            // Expiry dates fetched successfully
            res.json({
                success: true,
                data: result.data,
                symbol: result.symbol,
                source: result.source || 'api'
            });
        } else {
            // Expiry fetch failed
            
            // Handle specific error types
            if (result.error.includes('Unsupported symbol')) {
                return res.status(400).json({
                    success: false,
                    message: result.error,
                    supportedSymbols: ['NIFTY_50', 'BANK_NIFTY', 'FINNIFTY', 'SENSEX']
                });
            }
            
            if (result.error.includes('401') || result.error.includes('Unauthorized')) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid API credentials. Please check your Dhan API tokens.'
                });
            }
            
            if (result.error.includes('429') || result.error.includes('rate limit')) {
                return res.status(429).json({
                    success: false,
                    message: 'Rate limit exceeded. Please wait 3 seconds between requests.'
                });
            }
            
            return res.status(400).json({
                success: false,
                message: 'Failed to fetch expiry dates',
                error: result.error
            });
        }
        
    } catch (error) {
        // Expiry route error
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expiry dates',
            error: error.message
        });
    }
});

// Subscribe to option chain data via WebSocket
router.post('/option-chain/subscribe', async (req, res) => {
    try {
        const { symbol } = req.body;
        
        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: 'Symbol is required'
            });
        }

        // Map symbol to security ID for WebSocket subscription
        const SYMBOL_TO_ID = {
            'NIFTY_50': '13',
            'BANK_NIFTY': '25',
            'SENSEX': '51'
        };

        const securityId = SYMBOL_TO_ID[symbol.toUpperCase()];
        if (!securityId) {
            return res.status(400).json({
                success: false,
                message: 'Unsupported symbol for WebSocket subscription',
                supportedSymbols: Object.keys(SYMBOL_TO_ID)
            });
        }

        // Subscribe to option chain via WebSocket
        websocketService.subscribeToOptionChain(securityId, 'IDX_I');
        
        res.json({
            success: true,
            message: `Subscribed to option chain for ${symbol}`,
            symbol: symbol,
            securityId: securityId
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to subscribe to option chain',
            error: error.message
        });
    }
});

// Reload security cache
router.post('/reload-security-cache', async (req, res) => {
    try {
        const securityLookupService = require('../services/securityLookupService');
        securityLookupService.reloadCache();
        
        res.json({
            success: true,
            message: 'Security cache reloaded successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to reload security cache',
            error: error.message
        });
    }
});

// Clear WebSocket cache for clean data source switching
router.post('/clear-websocket-cache', async (req, res) => {
    try {
        websocketService.strikeOHLCData.clear();
        websocketService.optionChainData.clear();
        
        res.json({
            success: true,
            message: 'WebSocket cache cleared successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to clear WebSocket cache',
            error: error.message
        });
    }
});

// Get OHLC data for a specific strike (MUST be before option-chain route)
router.get('/strike-ohlc/:symbol/:expiry/:strike/:optionType', async (req, res) => {
    try {
        const { symbol, expiry, strike, optionType } = req.params;
        const { dataSource = 'websocket' } = req.query;
        console.log(`📊 Strike OHLC Request: ${symbol} ${expiry} ${strike} ${optionType} (source: ${dataSource})`);
        
        if (!symbol || !expiry || !strike || !optionType) {
            return res.status(400).json({
                success: false,
                message: 'All parameters (symbol, expiry, strike, optionType) are required'
            });
        }
        
        // Get security details
        const securityResult = await dhanService.getSecurityIdFromMaster(symbol, expiry, strike, optionType);
        
        if (!securityResult.success) {
            return res.status(404).json({
                success: false,
                message: 'Security not found in master list',
                error: securityResult.error
            });
        }

        let { securityId, exchangeSegment, instrument } = securityResult.data;
        
        // Fix exchange segment for SENSEX options
        if (symbol.toUpperCase() === 'SENSEX' && exchangeSegment === 'NSE_FNO') {
            exchangeSegment = 'BSE_FNO';
        }
        
        // STRICT data source separation
        if (dataSource === 'websocket') {
            // WebSocket mode - only return WebSocket data, no API fallback
            if (!websocketService.isConnected) {
                return res.status(503).json({
                    success: false,
                    message: 'WebSocket not connected',
                    source: 'websocket_unavailable'
                });
            }
            
            // Subscribe and get immediate data from cache
            websocketService.subscribeToStrikeOHLC(securityId, exchangeSegment);
            
            // Check cache immediately (no waiting)
            const wsData = websocketService.getStrikeOHLCData(securityId, exchangeSegment);
            
            if (wsData && wsData.ltp > 0) {
                console.log(`✅ Strike OHLC Response: websocket_realtime - ${symbol} ${strike} ${optionType}`);
                const currentTime = Date.now() / 1000;
                return res.json({
                    success: true,
                    data: {
                        timestamp: [currentTime],
                        open: [wsData.open],
                        high: [wsData.high],
                        low: [wsData.low],
                        close: [wsData.ltp],
                        volume: [wsData.volume]
                    },
                    source: 'websocket_realtime',
                    metadata: { symbol, expiry, strike, optionType, securityId, exchangeSegment }
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'No WebSocket data available for this strike',
                    source: 'websocket_no_data'
                });
            }
        } else {
            // API mode - only return historical API data
            const today = new Date();
            const fromDate = today.toISOString().split('T')[0];
            const toDate = fromDate;
            
            const ohlcResult = await dhanService.getStrikeOHLC(securityId, exchangeSegment, instrument, fromDate, toDate);
            
            if (ohlcResult.success) {
                console.log(`✅ Strike OHLC Response: api_historical - ${symbol} ${strike} ${optionType}`);
                
                res.json({
                    success: true,
                    data: ohlcResult.data,
                    source: 'api_historical',
                    metadata: { symbol, expiry, strike, optionType, securityId, exchangeSegment, fromDate, toDate }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to fetch historical OHLC data',
                    error: ohlcResult.error
                });
            }
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching OHLC data',
            error: error.message
        });
    }
});

// Get option chain (HYBRID: WebSocket + API fallback)
router.get('/option-chain/:symbol/:expiry', async (req, res) => {
    try {
        const { symbol, expiry } = req.params;
        
        if (!symbol || !expiry) {
            return res.status(400).json({
                success: false,
                message: 'Both symbol and expiry parameters are required'
            });
        }

        // Fetching option chain
        
        // Try WebSocket first
        const SYMBOL_TO_ID = {
            'NIFTY_50': '13',
            'BANK_NIFTY': '25', 
            'SENSEX': '51'
        };
        
        const securityId = SYMBOL_TO_ID[symbol.toUpperCase()];
        if (securityId && websocketService.isConnected) {
            // Subscribe to option chain
            websocketService.subscribeToOptionChain(securityId, expiry);
            
            const wsData = websocketService.getOptionChainData(securityId, expiry);
            if (wsData && Object.keys(wsData.oc).length > 0) {
                // Option chain from WebSocket
                return res.json({
                    success: true,
                    data: wsData,
                    symbol: symbol,
                    expiry: expiry,
                    source: 'websocket_realtime',
                    metadata: {
                        strikeCount: Object.keys(wsData.oc).length,
                        underlyingPrice: wsData.last_price,
                        fetchTime: new Date().toISOString()
                    }
                });
            }
        }
        
        // WebSocket option chain unavailable, using REST API
        const result = await dhanService.getOptionChain(symbol.trim(), expiry.trim());
        
        if (result.success) {
            const strikeCount = Object.keys(result.data.oc || {}).length;
            // Option chain fetched successfully
            
            res.json({
                success: true,
                data: result.data,
                symbol: result.symbol,
                expiry: result.expiry,
                source: 'rest_api',
                metadata: {
                    strikeCount: strikeCount,
                    underlyingPrice: result.data.last_price,
                    fetchTime: new Date().toISOString()
                }
            });
        } else {
            // Option chain fetch failed
            
            if (result.error.includes('Invalid expiry format')) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid expiry format. Use YYYY-MM-DD format (e.g., 2024-12-26)'
                });
            }
            
            if (result.error.includes('Unsupported symbol')) {
                return res.status(400).json({
                    success: false,
                    message: result.error,
                    supportedSymbols: ['NIFTY_50', 'BANK_NIFTY', 'FINNIFTY', 'SENSEX']
                });
            }
            
            if (result.error.includes('401') || result.error.includes('Unauthorized')) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid API credentials. Please check your Dhan API tokens.'
                });
            }
            
            if (result.error.includes('429') || result.error.includes('rate limit')) {
                return res.status(429).json({
                    success: false,
                    message: 'Rate limit exceeded. Please wait 3 seconds between requests.'
                });
            }
            
            return res.status(400).json({
                success: false,
                message: 'Failed to fetch option chain',
                error: result.error
            });
        }
        
    } catch (error) {
        // Option chain route error
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
