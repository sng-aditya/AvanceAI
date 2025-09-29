const WebSocket = require('ws');
const EventEmitter = require('events');

class DhanWebSocketService extends EventEmitter {
    constructor() {
        super();
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000;
        this.subscriptions = new Set();
        this.marketData = new Map();
        this.optionChainData = new Map();
        this.strikeOHLCData = new Map();
        
        this.accessToken = process.env.DHAN_ACCESS_TOKEN;
        this.clientId = process.env.DHAN_CLIENT_ID;
    }

    connect() {
        if (this.isConnected) return;

        const wsUrl = `wss://api-feed.dhan.co?version=2&token=${this.accessToken}&clientId=${this.clientId}&authType=2`;
        
        console.log('🔌 Connecting to Dhan WebSocket...');
        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
            console.log('✅ WebSocket connected to Dhan');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.subscribeToInstruments();
            this.emit('connected');
        });

        this.ws.on('message', (data) => {
            this.handleBinaryMessage(data);
        });

        this.ws.on('close', () => {
            console.log('🔌 WebSocket disconnected');
            this.isConnected = false;
            this.reconnect();
        });

        this.ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            this.emit('error', error);
        });
    }

    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
    }

    subscribeToInstruments() {
        const instruments = [
            { ExchangeSegment: "IDX_I", SecurityId: "13" },    // NIFTY_50
            { ExchangeSegment: "IDX_I", SecurityId: "25" },    // BANK_NIFTY
            { ExchangeSegment: "IDX_I", SecurityId: "51" },    // SENSEX
            { ExchangeSegment: "NSE_EQ", SecurityId: "2885" },  // RELIANCE
            { ExchangeSegment: "NSE_EQ", SecurityId: "11536" }, // TCS
            { ExchangeSegment: "NSE_EQ", SecurityId: "1333" },  // HDFCBANK
            { ExchangeSegment: "NSE_EQ", SecurityId: "1594" },  // INFY
            { ExchangeSegment: "NSE_EQ", SecurityId: "3787" },  // WIPRO
            { ExchangeSegment: "NSE_EQ", SecurityId: "4963" },  // ICICIBANK
            { ExchangeSegment: "NSE_EQ", SecurityId: "3045" },  // SBIN
            { ExchangeSegment: "NSE_EQ", SecurityId: "10604" }, // BHARTIARTL
        ];

        const subscriptionMessage = {
            RequestCode: 15,
            InstrumentCount: instruments.length,
            InstrumentList: instruments
        };

        this.send(subscriptionMessage);
        console.log(`📡 Subscribed to ${instruments.length} instruments`);
    }

    subscribeToOptionChain(underlyingId, expiry) {
        const optionChainMessage = {
            RequestCode: 21,
            UnderlyingId: parseInt(underlyingId),
            ExpiryDate: expiry
        };
        
        this.send(optionChainMessage);
        console.log(`📊 Subscribed to option chain: ${underlyingId} ${expiry}`);
    }

    subscribeToStrikeOHLC(securityId, exchangeSegment) {
        const subscriptionMessage = {
            RequestCode: 17, // Quote data (OHLC)
            InstrumentCount: 1,
            InstrumentList: [{
                ExchangeSegment: exchangeSegment,
                SecurityId: securityId.toString()
            }]
        };
        
        this.send(subscriptionMessage);
        console.log(`📈 Subscribed to strike OHLC: ${securityId} (${exchangeSegment})`);
    }

    handleBinaryMessage(binaryData) {
        try {
            if (binaryData.length < 8) return;

            const header = {
                feedResponseCode: binaryData.readUInt8(0),
                exchangeSegment: binaryData.readUInt16LE(1),
                reserved: binaryData.readUInt8(3),
                securityId: binaryData.readUInt32LE(4)
            };



            switch (header.feedResponseCode) {
                case 2: // Ticker packet
                    this.handleTickerPacket(binaryData, header);
                    break;
                case 4: // Quote data (OHLC)
                    this.handleQuotePacket(binaryData, header);
                    break;
                case 6: // Previous close data
                    this.handlePrevClosePacket(binaryData, header);
                    break;
                case 5: // OI data
                    this.handleOIDataPacket(binaryData, header);
                    break;
                case 7: // Option chain data
                    this.handleOptionChainPacket(binaryData, header);
                    break;
                default:
                    console.log(`🔍 Unknown response code: ${header.feedResponseCode}`);
            }
        } catch (error) {
            console.error('❌ Error parsing binary message:', error);
        }
    }

    handleTickerPacket(data, header) {
        const ltp = data.readFloatLE(8);
        const lastTradeTime = data.readUInt32LE(12);

        const key = `${header.exchangeSegment}_${header.securityId}`;
        const existing = this.marketData.get(key) || {};
        
        const tickerData = {
            ...existing,
            securityId: header.securityId,
            exchangeSegment: header.exchangeSegment,
            ltp: ltp,
            lastTradeTime: lastTradeTime,
            timestamp: new Date().toISOString()
        };

        this.marketData.set(key, tickerData);
        this.emit('marketUpdate', tickerData);
    }

    handleQuotePacket(data, header) {
        if (data.length < 50) return;
        
        try {
            // Official Dhan QuoteResponse structure from dhanmarketfeed.ts
            const ltp = data.readFloatLE(8);           // LTP
            const ltq = data.readUInt16LE(12);         // Last Trade Quantity
            const ltt = data.readUInt32LE(14);         // Last Trade Time
            const atp = data.readFloatLE(18);          // Average Trade Price
            const volume = data.readUInt32LE(22);      // Volume
            const totalSellQty = data.readUInt32LE(26); // Total Sell Quantity
            const totalBuyQty = data.readUInt32LE(30);  // Total Buy Quantity
            const openPrice = data.readFloatLE(34);    // Open Price
            const closePrice = data.readFloatLE(38);   // Close Price
            const highPrice = data.readFloatLE(42);    // High Price
            const lowPrice = data.readFloatLE(46);     // Low Price
            
            const key = `${header.exchangeSegment}_${header.securityId}`;
            const ohlcData = {
                securityId: header.securityId,
                exchangeSegment: header.exchangeSegment,
                ltp: parseFloat(ltp.toFixed(2)),
                open: parseFloat(openPrice.toFixed(2)),
                high: parseFloat(highPrice.toFixed(2)),
                low: parseFloat(lowPrice.toFixed(2)),
                close: parseFloat(closePrice.toFixed(2)),
                volume: volume,
                atp: parseFloat(atp.toFixed(2)),
                totalBuyQty: totalBuyQty,
                totalSellQty: totalSellQty,
                timestamp: new Date().toISOString()
            };
            
            // Only log quote data for debugging specific securities if needed
            // console.log(`📊 Quote Data: ${header.securityId} - LTP: ${ohlcData.ltp}, O: ${ohlcData.open}, H: ${ohlcData.high}, L: ${ohlcData.low}, V: ${ohlcData.volume}`);
            
            this.strikeOHLCData.set(key, ohlcData);
            this.emit('strikeOHLCUpdate', ohlcData);
        } catch (error) {
            console.error('❌ Error parsing quote packet:', error);
        }
    }

    handlePrevClosePacket(data, header) {
        const prevClose = data.readFloatLE(8);
        
        const key = `${header.exchangeSegment}_${header.securityId}`;
        const existing = this.marketData.get(key) || {};
        
        const updatedData = {
            ...existing,
            securityId: header.securityId,
            exchangeSegment: header.exchangeSegment,
            prevClose: prevClose,
            timestamp: new Date().toISOString()
        };

        // Calculate change if we have both LTP and prevClose
        if (updatedData.ltp && updatedData.prevClose) {
            updatedData.change = updatedData.ltp - updatedData.prevClose;
            updatedData.changePercent = (updatedData.change / updatedData.prevClose) * 100;
            updatedData.isPositive = updatedData.change >= 0;
        }

        this.marketData.set(key, updatedData);
    }

    getMarketData() {
        const result = { stocks: [], indices: [] };
        
        for (const [key, data] of this.marketData) {
            const symbol = this.getSymbolBySecurityId(data.securityId.toString());
            if (!symbol) continue;

            // Only include items that have both LTP and prevClose for proper change calculation
            if (!data.ltp || !data.prevClose) continue;

            const change = data.ltp - data.prevClose;
            const changePercent = (change / data.prevClose) * 100;

            const item = {
                symbol: symbol,
                name: symbol,
                ltp: data.ltp,
                change: change,
                changePercent: changePercent,
                open: data.open || data.prevClose,
                high: data.high || data.ltp,
                low: data.low || data.ltp,
                prevClose: data.prevClose,
                volume: data.volume || 0,
                isPositive: change >= 0,
                timestamp: data.timestamp
            };

            if (this.isIndex(data.securityId.toString())) {
                result.indices.push(item);
            } else {
                result.stocks.push(item);
            }
        }
        
        // console.log(`📊 WebSocket Data: ${result.stocks.length} stocks, ${result.indices.length} indices with complete data`);
        return result;
    }

    getSymbolBySecurityId(securityId) {
        const SECURITY_MAPPING = {
            "13": "NIFTY_50",
            "25": "BANK_NIFTY", 
            "51": "SENSEX",
            "2885": "RELIANCE",
            "11536": "TCS",
            "1333": "HDFCBANK",
            "1594": "INFY",
            "3787": "WIPRO",
            "4963": "ICICIBANK",
            "3045": "SBIN",
            "10604": "BHARTIARTL"
        };

        return SECURITY_MAPPING[securityId] || null;
    }

    isIndex(securityId) {
        const indexIds = ["13", "25", "51"];
        return indexIds.includes(securityId.toString());
    }

    handleOIDataPacket(data, header) {
        try {
            if (data.length < 12) return;
            const openInterest = data.readUInt32LE(8);
            // Just log for now, can be used for OI tracking
        } catch (error) {
            console.error('❌ Error parsing OI packet:', error);
        }
    }

    handleOptionChainPacket(data, header) {
        try {
            if (data.length < 20) return;
            
            const strikePrice = data.readFloatLE(8);
            const callLTP = data.readFloatLE(12);
            const putLTP = data.readFloatLE(16);
            
            const key = `${header.securityId}`;
            const existing = this.optionChainData.get(key) || { oc: {}, last_price: 0 };
            existing.oc[strikePrice.toFixed(2)] = {
                ce: { last_price: callLTP },
                pe: { last_price: putLTP },
                _ts: new Date().toISOString()
            };
            
            this.optionChainData.set(key, existing);
        } catch (error) {
            console.error('❌ Error parsing option chain packet:', error);
        }
    }

    getOptionChainData(underlyingId, expiryDate) {
        const key = `${underlyingId}`;
        const data = this.optionChainData.get(key);
        if (data && data.oc && Object.keys(data.oc).length > 0) {
            return { last_price: data.last_price || 0, oc: data.oc };
        }
        return null;
    }

    getStrikeOHLCData(securityId, exchangeSegment) {
        // Try multiple possible keys since WebSocket uses different exchange segments
        const possibleKeys = [
            `50_${securityId}`, // Actual WebSocket key format
            `8_${securityId}`,  // BSE_FNO
            `2_${securityId}`,  // NSE_FNO
            `${exchangeSegment}_${securityId}`
        ];
        
        for (const key of possibleKeys) {
            const data = this.strikeOHLCData.get(key);
            if (data) {
                console.log(`✅ Found strike OHLC data with key: ${key}`);
                return data;
            }
        }
        
        console.log(`❌ No strike OHLC data found for security ${securityId}`);
        console.log(`🔍 Available keys: [${Array.from(this.strikeOHLCData.keys()).join(', ')}]`);
        return null;
    }

    send(message) {
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify(message));
        }
    }

    async subscribe(feedRequestCode, instruments) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const subscriptionMessage = {
                RequestCode: feedRequestCode,
                InstrumentCount: instruments.length,
                InstrumentList: instruments.map(([exchangeSegment, securityId]) => ({
                    ExchangeSegment: exchangeSegment,
                    SecurityId: securityId
                }))
            };
            this.ws.send(JSON.stringify(subscriptionMessage));
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.isConnected = false;
        }
    }
}

module.exports = new DhanWebSocketService();