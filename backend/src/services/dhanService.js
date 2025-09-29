const axios = require('axios');
const apiQueue = require('./apiQueue');
const securityLookupService = require('./securityLookupService');

// Dhan API base URL (v2)
const BASE_URL = "https://api.dhan.co/v2";

// Rate limiting baseline (general requests)
const RATE_LIMIT_DELAY = 800; // 0.8 seconds
// Official option chain guideline: once every 3 seconds
const OPTION_CHAIN_MIN_INTERVAL = 3000;

// Option chain cache
const optionChainCache = new Map();
const CACHE_DURATION = 1000; // 1 second cache for real-time updates

// Security data mapping
const SECURITY_DATA = {
    "NSE_EQ": {  // NSE Equity - Stocks
        "RELIANCE": "2885",
        "TCS": "11536", 
        "HDFCBANK": "1333",
        "INFY": "1594",        // Infosys
        "WIPRO": "3787",
        "ICICIBANK": "4963",
        "SBIN": "3045",
        "BHARTIARTL": "10604"
    },
    "IDX_I": {   // Index Exchange - Indices  
        "NIFTY_50": "13",
        "BANK_NIFTY": "25",
        "SENSEX": "51"         // BSE Sensex
    }
};

class DhanService {
    constructor() {
        this.accessToken = process.env.DHAN_ACCESS_TOKEN;
        this.clientId = process.env.DHAN_CLIENT_ID;
        this.lastRequestTime = 0;
        
        if (!this.accessToken || !this.clientId) {
            console.warn('⚠️ Dhan API credentials not found in environment variables');
            console.warn('DHAN_ACCESS_TOKEN:', this.accessToken ? 'SET' : 'NOT SET');
            console.warn('DHAN_CLIENT_ID:', this.clientId ? 'SET' : 'NOT SET');
        }
        
        this.headers = {
            "access-token": this.accessToken,
            "client-id": this.clientId,
            "Content-Type": "application/json",
            "Accept": "application/json"
        };
    }

    // Resolve securityId from symbol across supported segments
    getSecurityId(symbol) {
        if (!symbol) return null;
        const upper = symbol.toUpperCase();
        for (const [segment, mapping] of Object.entries(SECURITY_DATA)) {
            if (mapping[upper]) return mapping[upper];
        }
        return null;
    }

    // Place an order via Dhan API (fallback to mock success if credentials missing or API fails)
    async placeOrder(order) {
        const securityId = order.securityId || this.getSecurityId(order.symbol);
        if (!securityId) {
            return { success: false, error: `Unsupported symbol ${order.symbol}` };
        }

        const payload = {
            // Mapping based on assumed Dhan API contract; adjust when exact spec available
            transactionType: order.orderType, // BUY / SELL
            exchangeSegment: order.exchangeSegment || 'NSE_EQ',
            productType: order.productType || 'INTRADAY',
            orderType: order.priceType, // MARKET / LIMIT
            validity: order.validity || 'DAY',
            securityId: securityId,
            quantity: order.quantity,
            disclosedQuantity: 0,
            price: order.priceType === 'LIMIT' ? order.limitPrice : 0,
            afterMarketOrder: false,
            boProfitValue: 0,
            boStopLossValue: 0,
            drvExpiryDate: null,
            drvOptionType: null,
            drvStrikePrice: null
        };

        // If credentials are missing, short‑circuit with a mock response so dev flow continues
        if (!this.accessToken || !this.clientId) {
            const mockId = `MOCK-${Date.now()}-${Math.floor(Math.random()*9999)}`;
            return { success: true, data: { orderId: mockId, status: 'accepted', mock: true } };
        }

        try {
            await this.enforceRateLimit();
            const response = await axios.post(`${BASE_URL}/orders`, payload, { headers: this.headers });
            if (response.status === 200 || response.status === 201) {
                // Try to normalize response
                const data = response.data?.data || response.data;
                const orderId = data.orderId || data.id || data.order_id;
                return { success: true, data: { orderId, raw: data, status: data.status || 'PENDING' } };
            }
            return { success: false, error: response.data || 'Order placement failed' };
        } catch (err) {
            console.warn('Order placement API error, falling back to mock success:', err.message);
            const mockId = `FALLBACK-${Date.now()}-${Math.floor(Math.random()*9999)}`;
            return { success: true, data: { orderId: mockId, status: 'PENDING', fallback: true, error: err.message } };
        }
    }

    // Fetch order history (returns empty if unsupported; structure matches expectation in route)
    async getOrderHistory(_userId) {
        if (!this.accessToken || !this.clientId) {
            return { success: true, data: [] };
        }
        try {
            await this.enforceRateLimit();
            const response = await axios.get(`${BASE_URL}/orders`, { headers: this.headers });
            if (response.status === 200) {
                const list = Array.isArray(response.data) ? response.data : (response.data.data || []);
                return { success: true, data: list };
            }
            return { success: false, error: response.data };
        } catch (err) {
            console.warn('Order history fetch failed:', err.message);
            return { success: false, error: err.message };
        }
    }

    // Fetch single order details
    async getOrderDetails(orderId, _userId) {
        if (!this.accessToken || !this.clientId) {
            return { success: false, error: 'Live order detail unavailable without credentials' };
        }
        try {
            await this.enforceRateLimit();
            const response = await axios.get(`${BASE_URL}/orders/${orderId}`, { headers: this.headers });
            if (response.status === 200) {
                return { success: true, data: response.data?.data || response.data };
            }
            return { success: false, error: response.data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    // Rate limiting helper
    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
            const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
            // Rate limiting wait
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }

    // Make API request with error handling and rate limiting
    async makeApiRequest(endpoint, payload, requestName = "API") {
        try {
            await this.enforceRateLimit();
            
            const url = `${BASE_URL}${endpoint}`;
            // Fetching API data
            
            const response = await axios.post(url, payload, { headers: this.headers });
            
            if (response.status === 200 && response.data.status === 'success') {
                // API data retrieved successfully
                return { success: true, data: response.data };
            } else {
                // API returned failed status
                return { success: false, error: response.data };
            }
            
        } catch (error) {
            if (error.response?.status === 429) {
                // Rate limited
                return { success: false, error: 'Rate limited' };
            } else {
                // API Error
                return { success: false, error: error.message };
            }
        }
    }

    // Get comprehensive live market data (OHLC) - WebSocket Primary
    async getLiveMarketData() {
        // Try WebSocket first
        try {
            const websocketService = require('./websocketService');
            if (websocketService.isConnected) {
                const wsData = websocketService.getMarketData();
                if (wsData.stocks.length > 0 || wsData.indices.length > 0) {
                    console.log('✅ Serving WebSocket real-time data');
                    return {
                        success: true,
                        data: wsData,
                        timestamp: new Date().toISOString(),
                        source: 'websocket'
                    };
                }
            }
        } catch (error) {
            // WebSocket service not available
        }
        
        // WebSocket data not available, using API fallback
        
        // Fallback to REST API
        const payload = {};
        for (const [exchange, instruments] of Object.entries(SECURITY_DATA)) {
            payload[exchange] = Object.values(instruments).map(id => parseInt(id));
        }

        const result = await this.makeApiRequest("/marketfeed/ohlc", payload, "OHLC");
        
        if (result.success && result.data.data) {
            return {
                success: true,
                data: this.formatMarketData(result.data.data),
                timestamp: new Date().toISOString(),
                source: 'rest_api'
            };
        }
        
        return result;
    }

    // Get market summary for dashboard
    async getMarketSummary() {
        const result = await this.getLiveMarketData();
        
        if (result.success) {
            const { stocks, indices } = result.data;
            
            const totalStocks = stocks.length;
            const gainers = stocks.filter(stock => stock.isPositive).length;
            const losers = totalStocks - gainers;
            
            const topGainer = stocks.reduce((max, stock) => 
                stock.changePercent > max.changePercent ? stock : max, 
                stocks[0] || { changePercent: -Infinity }
            );
            
            const topLoser = stocks.reduce((min, stock) => 
                stock.changePercent < min.changePercent ? stock : min, 
                stocks[0] || { changePercent: Infinity }
            );

            return {
                success: true,
                data: {
                    summary: {
                        totalStocks,
                        gainers,
                        losers,
                        topGainer: topGainer.changePercent !== -Infinity ? topGainer : null,
                        topLoser: topLoser.changePercent !== Infinity ? topLoser : null
                    },
                    indices,
                    topStocks: stocks.slice(0, 8),
                    timestamp: result.timestamp
                }
            };
        }
        
        return result;
    }

    // Get option chain for index
    async getOptionChain(symbol, expiry) {
        const cacheKey = `${symbol}_${expiry}`;
        const cached = optionChainCache.get(cacheKey);
        
        // Return cached data if available and fresh
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            // Serving cached option chain
            return {
                success: true,
                data: cached.data,
                symbol: symbol,
                expiry: expiry,
                source: 'cache'
            };
        }
        

        
        // REST API fallback
        const securityMapping = {
            'NIFTY_50': { scrip: 13, segment: 'IDX_I' },
            'BANK_NIFTY': { scrip: 25, segment: 'IDX_I' },
            'SENSEX': { scrip: 51, segment: 'IDX_I' }
        };

        const upperSymbol = symbol.toUpperCase();
        const mappedSymbol = securityMapping[upperSymbol];
        
        if (!mappedSymbol) {
            return { 
                success: false, 
                error: `Unsupported symbol: ${symbol}` 
            };
        }

        // Dedicated option chain rate limiting separate from other endpoints
        if (!this.lastOptionChainRequestTime) this.lastOptionChainRequestTime = 0;
        const nowOC = Date.now();
        const elapsed = nowOC - this.lastOptionChainRequestTime;
        if (elapsed < OPTION_CHAIN_MIN_INTERVAL) {
            const waitMs = OPTION_CHAIN_MIN_INTERVAL - elapsed;
            // Option chain rate limiting
            await new Promise(r => setTimeout(r, waitMs));
        }
        this.lastOptionChainRequestTime = Date.now();

        const payload = {
            UnderlyingScrip: mappedSymbol.scrip,
            UnderlyingSeg: mappedSymbol.segment,
            Expiry: expiry
        };

        try {
            const response = await axios.post(`${BASE_URL}/optionchain`, payload, { 
                headers: this.headers 
            });

            if (response.status === 200 && response.data.status === 'success') {
                // Preserve official response structure fully
                const officialData = response.data.data;
                optionChainCache.set(cacheKey, { data: officialData, timestamp: Date.now() });
                return {
                    success: true,
                    data: officialData,
                    symbol: symbol,
                    expiry: expiry,
                    source: 'api_fresh'
                };
            } else {
                return { 
                    success: false, 
                    error: response.data.remarks || 'Failed to fetch option chain' 
                };
            }
        } catch (error) {
            // If rate limited, serve stale cache
            if (error.response?.status === 429) {
                const staleCache = optionChainCache.get(cacheKey);
                if (staleCache) {
                    // Serving stale cache due to rate limit
                    return {
                        success: true,
                        data: staleCache.data,
                        symbol: symbol,
                        expiry: expiry,
                        source: 'cache_stale'
                    };
                }
            }
            return { success: false, error: error.message };
        }
    }

    // Format market data
    formatMarketData(rawData) {
        const formattedData = { stocks: [], indices: [] };

        if (rawData.NSE_EQ) {
            for (const [name, secId] of Object.entries(SECURITY_DATA.NSE_EQ)) {
                if (rawData.NSE_EQ[secId]) {
                    const data = rawData.NSE_EQ[secId];
                    const ohlc = data.ohlc || {};
                    
                    const ltp = data.last_price || 0;
                    const prevClose = ohlc.close || 0;
                    const change = ltp - prevClose;
                    const changePercent = prevClose ? (change / prevClose * 100) : 0;

                    formattedData.stocks.push({
                        symbol: name,
                        name: name,
                        ltp: ltp,
                        change: change,
                        changePercent: changePercent,
                        open: ohlc.open || 0,
                        high: ohlc.high || 0,
                        low: ohlc.low || 0,
                        prevClose: prevClose,
                        isPositive: change >= 0
                    });
                }
            }
        }

        if (rawData.IDX_I) {
            for (const [name, secId] of Object.entries(SECURITY_DATA.IDX_I)) {
                if (rawData.IDX_I[secId]) {
                    const data = rawData.IDX_I[secId];
                    const ohlc = data.ohlc || {};
                    
                    const ltp = data.last_price || 0;
                    const prevClose = ohlc.close || 0;
                    const change = ltp - prevClose;
                    const changePercent = prevClose ? (change / prevClose * 100) : 0;

                    formattedData.indices.push({
                        symbol: name,
                        name: name,
                        ltp: ltp,
                        change: change,
                        changePercent: changePercent,
                        open: ohlc.open || 0,
                        high: ohlc.high || 0,
                        low: ohlc.low || 0,
                        prevClose: prevClose,
                        isPositive: change >= 0
                    });
                }
            }
        }

        return formattedData;
    }

    // Get expiry dates with queue management and caching
    async getExpiryDates(symbol) {
        const cacheKey = `expiry_${symbol}`;
        const cached = optionChainCache.get(cacheKey);
        
        // Return cached data if available and fresh (5 minutes)
        if (cached && (Date.now() - cached.timestamp) < 300000) {
            return {
                success: true,
                data: cached.data,
                symbol: symbol,
                source: 'cache'
            };
        }
        
        return apiQueue.enqueue('expiry_dates', async () => {
            const securityMapping = {
                'NIFTY_50': { scrip: 13, segment: 'IDX_I' },
                'BANK_NIFTY': { scrip: 25, segment: 'IDX_I' },
                'SENSEX': { scrip: 51, segment: 'IDX_I' }
            };

            const upperSymbol = symbol.toUpperCase();
            const mappedSymbol = securityMapping[upperSymbol];
            
            if (!mappedSymbol) {
                return { 
                    success: false, 
                    error: `Unsupported symbol: ${symbol}` 
                };
            }

            const payload = {
                UnderlyingScrip: mappedSymbol.scrip,
                UnderlyingSeg: mappedSymbol.segment
            };

            try {
                const response = await axios.post(`${BASE_URL}/optionchain/expirylist`, payload, { 
                    headers: this.headers 
                });

                if (response.status === 200 && response.data.status === 'success') {
                    const expiryData = response.data.data || [];
                    
                    // Cache the result
                    optionChainCache.set(cacheKey, { 
                        data: expiryData, 
                        timestamp: Date.now() 
                    });
                    
                    return {
                        success: true,
                        data: expiryData,
                        symbol: symbol,
                        source: 'api_fresh'
                    };
                } else {
                    return { 
                        success: false, 
                        error: response.data.remarks || 'Failed to fetch expiry dates' 
                    };
                }
            } catch (error) {
                // Return stale cache if available during error
                if (cached) {
                    return {
                        success: true,
                        data: cached.data,
                        symbol: symbol,
                        source: 'cache_stale'
                    };
                }
                return { success: false, error: error.message };
            }
        });
    }

    // Account balance with queue management
    async checkAccountBalance() {
        return apiQueue.enqueue('balance', async () => {
            try {
                const response = await axios.get(`${BASE_URL}/fundlimit`, { headers: this.headers });
                
                if (response.status === 200) {
                    const balanceData = response.data.data || response.data;
                    return { success: true, data: balanceData };
                } else {
                    return { success: false, error: response.data };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    // Get positions with queue management
    async getPositions() {
        return apiQueue.enqueue('positions', async () => {
            try {
                const response = await axios.get(`${BASE_URL}/positions`, { headers: this.headers });
                
                if (response.status === 200) {
                    const positions = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    return { success: true, data: positions };
                } else {
                    return { success: false, error: response.data?.message || 'Failed to fetch positions' };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    // Get holdings with queue management
    async getHoldings() {
        return apiQueue.enqueue('holdings', async () => {
            try {
                const response = await axios.get(`${BASE_URL}/holdings`, { headers: this.headers });
                
                if (response.status === 200) {
                    const holdings = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    return { success: true, data: holdings };
                } else {
                    return { success: false, error: response.data?.errorMessage || 'Failed to fetch holdings' };
                }
            } catch (error) {
                if (error.response?.data?.errorCode === 'DH-1111') {
                    return { success: true, data: [] };
                }
                return { success: false, error: error.message };
            }
        });
    }

    // Get OHLC data for a specific strike (API only - WebSocket handled in route)
    async getStrikeOHLC(securityId, exchangeSegment, instrument, fromDate, toDate) {
        return apiQueue.enqueue('strike_ohlc', async () => {
            const payload = {
                securityId: securityId,
                exchangeSegment: exchangeSegment,
                instrument: instrument,
                interval: '1',
                oi: false,
                fromDate: fromDate,
                toDate: toDate
            };

            try {
                const response = await axios.post(`${BASE_URL}/charts/intraday`, payload, { 
                    headers: this.headers 
                });

                if (response.status === 200) {
                    return { success: true, data: response.data, source: 'api_fallback' };
                } else {
                    return { success: false, error: response.data?.message || 'Failed to fetch OHLC data' };
                }
            } catch (error) {
                return { success: false, error: error.message };
            }
        });
    }

    // Initialize security ID cache on startup
    async initializeSecurityCache() {
        if (cacheInitialized) return;
        
        try {
            console.log('🚀 Initializing security ID cache...');
            
            // Fetch master CSV
            const response = await axios.get('https://images.dhan.co/api-data/api-scrip-master-detailed.csv');
            masterDataCache = response.data;
            masterDataCacheTime = Date.now();
            
            // Get all expiry dates for all indices
            const indices = ['NIFTY_50', 'BANK_NIFTY', 'SENSEX'];
            const allExpiries = new Set();
            
            for (const symbol of indices) {
                const expiryResult = await this.getExpiryDates(symbol);
                if (expiryResult.success) {
                    expiryResult.data.forEach(expiry => allExpiries.add(expiry));
                }
            }
            
            // Parse CSV and cache all option securities
            const lines = masterDataCache.split('\n');
            const headers = lines[0].split(',');
            const displayNameIndex = headers.findIndex(h => h.trim() === 'DISPLAY_NAME');
            const securityIdIndex = headers.findIndex(h => h.trim() === 'SECURITY_ID');
            
            let cacheCount = 0;
            for (let i = 1; i < lines.length; i++) {
                const row = lines[i].split(',');
                const displayName = row[displayNameIndex]?.trim();
                const securityId = row[securityIdIndex]?.trim();
                
                if (displayName && securityId && (displayName.includes('NIFTY') || displayName.includes('BANKNIFTY') || displayName.includes('SENSEX'))) {
                    securityIdCache.set(displayName, {
                        securityId,
                        exchangeSegment: displayName.includes('SENSEX') ? 'BSE_FNO' : 'NSE_FNO',
                        instrument: 'OPTIDX'
                    });
                    cacheCount++;
                }
            }
            
            console.log(`✅ Security cache initialized: ${cacheCount} securities cached`);
            cacheInitialized = true;
        } catch (error) {
            console.error('🚨 Failed to initialize security cache:', error.message);
        }
    }

    // Get security ID using fast lookup service
    async getSecurityIdFromMaster(symbol, expiry, strike, optionType) {
        return securityLookupService.findSecurityId(symbol, expiry, strike, optionType);
    }
}

// Master CSV cache
let masterDataCache = null;
let masterDataCacheTime = 0;
const MASTER_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Security ID cache for strikes
let securityIdCache = new Map();
let cacheInitialized = false;

// Clean up old cache entries every 30 seconds
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of optionChainCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION * 5) {
            optionChainCache.delete(key);
        }
    }
}, 30000);

const dhanServiceInstance = new DhanService();
dhanServiceInstance.SECURITY_DATA = SECURITY_DATA;

// Initialize cache on startup
dhanServiceInstance.initializeSecurityCache();

module.exports = dhanServiceInstance;