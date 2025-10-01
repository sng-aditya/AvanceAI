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
        // Use string format like the working test - this is the key!
        const subscriptionMessage = {
            RequestCode: 17, // Quote data (this is what works)
            InstrumentCount: 1,
            InstrumentList: [{
                ExchangeSegment: exchangeSegment, // Use string format: "NSE_FNO", "BSE_FNO"
                SecurityId: securityId.toString()
            }]
        };
        
        this.send(subscriptionMessage);
        console.log(`📈 Subscribed to strike OHLC: ${securityId} (${exchangeSegment})`);
    }


    handleBinaryMessage(binaryData) {
        try {
            if (binaryData.length < 8) return;

            const responseCode = binaryData.readUInt8(0);
            
            // Parse according to working test format
            if (responseCode === 4 && binaryData.length >= 50) {
                // Quote data - use the working parsing format
                const messageLength = binaryData.readUInt16LE(1);
                const exchangeSegment = binaryData.readUInt8(3);
                const securityId = binaryData.readUInt32LE(4);
                
                const header = {
                    feedResponseCode: responseCode,
                    exchangeSegment: exchangeSegment,
                    securityId: securityId
                };
                
                this.handleQuotePacket(binaryData, header);
            } else {
                // Other message types - use original parsing
                const exchangeSegment = binaryData.readUInt8(1);
                const securityId = binaryData.readUInt32LE(4);
                
                const header = {
                    feedResponseCode: responseCode,
                    exchangeSegment: exchangeSegment,
                    securityId: securityId
                };

                switch (responseCode) {
                    case 2: // Ticker packet
                        this.handleTickerPacket(binaryData, header);
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
                        console.log(`🔍 Unknown response code: ${responseCode}`);
                }
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
        // Based on working test, data comes with exchange segment 2 for NSE_FNO
        const possibleKeys = [
            `2_${securityId}`,  // NSE_FNO (working format)
            `8_${securityId}`,  // BSE_FNO
            `16_${securityId}`, // Fallback
            `1_${securityId}`,  // NSE_EQ
            `4_${securityId}`,  // BSE_EQ
            `0_${securityId}`,  // IDX_I
        ];
        
        // Check OHLC data first
        for (const key of possibleKeys) {
            const data = this.strikeOHLCData.get(key);
            if (data) {
                console.log(`✅ Found strike OHLC data with key: ${key}`);
                return data;
            }
        }
        
        // Check ticker data as fallback
        for (const key of possibleKeys) {
            const data = this.marketData.get(key);
            if (data && data.ltp) {
                console.log(`✅ Found ticker data with key: ${key}, converting to OHLC format`);
                return {
                    securityId: data.securityId,
                    exchangeSegment: data.exchangeSegment,
                    ltp: data.ltp,
                    open: data.ltp,
                    high: data.ltp,
                    low: data.ltp,
                    close: data.ltp,
                    volume: 0,
                    timestamp: data.timestamp
                };
            }
        }
        
        console.log(`❌ No strike OHLC data found for security ${securityId}`);
        console.log(`🔍 Available OHLC keys: [${Array.from(this.strikeOHLCData.keys()).join(', ')}]`);
        console.log(`🔍 Available ticker keys: [${Array.from(this.marketData.keys()).join(', ')}]`);
        return null;
    }

    send(message) {
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify(message));
        }
    }

    subscribeBinary(feedRequestCode, instruments) {
        if (!this.ws || !this.isConnected) return;
        
        const numInstruments = instruments.length;
        const messageLength = 83 + 4 + numInstruments * 21;
        
        // Create header
        const header = Buffer.alloc(83);
        header.writeInt16LE(feedRequestCode, 0);
        header.writeInt32LE(messageLength, 2);
        header.write(this.clientId, 6, 'utf-8');
        
        // Number of instruments
        const numInstrumentsBytes = Buffer.alloc(4);
        numInstrumentsBytes.writeInt32LE(numInstruments, 0);
        
        // Instrument info
        let instrumentInfo = Buffer.alloc(0);
        instruments.forEach(([exchangeSegment, securityId]) => {
            const segmentBuffer = Buffer.alloc(1);
            segmentBuffer.writeUInt8(exchangeSegment, 0);
            const securityIdBuffer = Buffer.alloc(20);
            securityIdBuffer.write(securityId, 0, 'utf-8');
            instrumentInfo = Buffer.concat([instrumentInfo, segmentBuffer, securityIdBuffer]);
        });
        
        // Padding for remaining slots (up to 100 instruments)
        const padding = Buffer.alloc((100 - numInstruments) * 21);
        instrumentInfo = Buffer.concat([instrumentInfo, padding]);
        
        const subscriptionPacket = Buffer.concat([header, numInstrumentsBytes, instrumentInfo]);
        this.ws.send(subscriptionPacket);
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