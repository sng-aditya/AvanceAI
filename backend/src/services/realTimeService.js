const websocketService = require('./websocketService');

class RealTimeService {
    constructor() {
        this.marketCache = new Map();
        this.optionCache = new Map();
        this.strikeOHLCCache = new Map();
        this.subscribers = new Set();
        this.lastUpdate = null;
        
        this.initializeWebSocket();
    }

    initializeWebSocket() {
        websocketService.on('marketUpdate', (data) => {
            this.handleMarketUpdate(data);
        });

        websocketService.on('optionChainUpdate', ({ key, data }) => {
            this.handleOptionChainUpdate(key, data);
        });

        websocketService.on('strikeOHLCUpdate', (data) => {
            this.handleStrikeOHLCUpdate(data);
        });
    }

    handleMarketUpdate(data) {
        const symbol = this.getSymbolBySecurityId(data.securityId, data.exchangeSegment);
        if (!symbol) return;

        const marketData = {
            symbol,
            ltp: data.ltp,
            change: data.ltp_change,
            changePercent: data.ltp_percent_change,
            open: data.open,
            high: data.high,
            low: data.low,
            volume: data.volume,
            timestamp: new Date().toISOString(),
            isPositive: data.ltp_change >= 0
        };

        this.marketCache.set(symbol, marketData);
        this.lastUpdate = new Date();
        
        // Broadcast to all subscribers
        this.broadcastUpdate('market', marketData);
    }

    handleOptionChainUpdate(key, data) {
        this.optionCache.set(key, {
            ...data,
            timestamp: new Date().toISOString()
        });
        
        this.broadcastUpdate('optionChain', { key, data });
    }

    handleStrikeOHLCUpdate(data) {
        const key = `${data.exchangeSegment}_${data.securityId}`;
        this.strikeOHLCCache.set(key, {
            ...data,
            timestamp: new Date().toISOString()
        });
        
        this.broadcastUpdate('strikeOHLC', data);
    }

    broadcastUpdate(type, data) {
        this.subscribers.forEach(callback => {
            try {
                callback({ type, data, timestamp: new Date().toISOString() });
            } catch (error) {
                console.error('Broadcast error:', error);
            }
        });
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    getMarketData() {
        const stocks = [];
        const indices = [];

        for (const [symbol, data] of this.marketCache) {
            if (this.isStock(symbol)) {
                stocks.push(data);
            } else {
                indices.push(data);
            }
        }

        return {
            stocks,
            indices,
            lastUpdate: this.lastUpdate,
            source: 'websocket_realtime',
            count: this.marketCache.size
        };
    }

    getOptionChainData(underlyingId, expiry) {
        const key = `${underlyingId}_${expiry}`;
        return this.optionCache.get(key) || null;
    }

    getStrikeOHLCData(securityId, exchangeSegment) {
        const key = `${exchangeSegment}_${securityId}`;
        return this.strikeOHLCCache.get(key) || null;
    }

    isStock(symbol) {
        const stockSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'WIPRO', 'ICICIBANK', 'SBIN', 'BHARTIARTL'];
        return stockSymbols.includes(symbol);
    }

    getSymbolBySecurityId(securityId, exchangeSegment) {
        const mapping = {
            1: { // NSE_EQ
                '2885': 'RELIANCE',
                '11536': 'TCS',
                '1333': 'HDFCBANK',
                '1594': 'INFY',
                '3787': 'WIPRO',
                '4963': 'ICICIBANK',
                '3045': 'SBIN',
                '10604': 'BHARTIARTL'
            },
            51: { // IDX_I
                '13': 'NIFTY_50',
                '25': 'BANK_NIFTY',
                '51': 'SENSEX'
            }
        };
        
        return mapping[exchangeSegment]?.[securityId.toString()] || null;
    }

    getConnectionStatus() {
        return {
            connected: websocketService.isConnected,
            lastUpdate: this.lastUpdate,
            cacheSize: this.marketCache.size,
            subscribers: this.subscribers.size
        };
    }
}

module.exports = new RealTimeService();