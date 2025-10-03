const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');

const logger = new Logger('SecurityLookup');

class SecurityLookupService {
    constructor() {
        this.cache = new Map();
        this.csvPath = path.join(__dirname, '../../Security_Id.csv');
        this.isInitialized = false;
    }

    initializeCache() {
        if (this.isInitialized) return;
        this.loadCache();
        this.isInitialized = true;
    }

    loadCache() {
        try {
            if (!fs.existsSync(this.csvPath)) {
                logger.warn('Security_Id.csv not found, creating empty cache');
                return;
            }

            const csvData = fs.readFileSync(this.csvPath, 'utf8');
            const lines = csvData.split('\n').slice(1); // Skip header
            
            let loadedCount = 0;
            lines.forEach(line => {
                const [securityId, displayName] = line.split(',');
                if (securityId && displayName) {
                    this.cache.set(displayName.trim(), securityId.trim());
                    loadedCount++;
                }
            });

            logger.info(`Security Cache: Loaded ${loadedCount} securities`);
        } catch (error) {
            logger.error('Error loading security cache', { error: error.message });
        }
    }

    findSecurityId(symbol, expiry, strike, optionType) {
        // Map symbols to CSV format
        const symbolMap = {
            'BANK_NIFTY': 'BANKNIFTY',
            'NIFTY_50': 'NIFTY',
            'SENSEX': 'SENSEX'
        };
        const csvSymbol = symbolMap[symbol] || symbol;
        
        // Map option types to CSV format
        const csvOptionType = optionType === 'CE' ? 'CALL' : 'PUT';
        
        // Format expiry date to match CSV format (e.g., "07 OCT")
        const expiryDate = new Date(expiry);
        const day = expiryDate.getDate().toString().padStart(2, '0');
        const month = expiryDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const formattedExpiry = `${day} ${month}`;
        
        const searchPattern = `${csvSymbol} ${formattedExpiry} ${strike} ${csvOptionType}`;
        
        logger.debug('Security Lookup Details', {
            original: `${symbol} ${expiry} ${strike} ${optionType}`,
            mapped: `${csvSymbol} ${formattedExpiry} ${strike} ${csvOptionType}`,
            searchPattern
        });

        if (this.cache.has(searchPattern)) {
            const securityId = this.cache.get(searchPattern);
            logger.debug(`Found security: ${searchPattern} -> ${securityId}`);
            return {
                success: true,
                data: {
                    securityId: securityId,
                    displayName: searchPattern,
                    exchangeSegment: csvSymbol === 'SENSEX' ? 'BSE_FNO' : 'NSE_FNO',
                    instrument: 'OPTIDX'
                }
            };
        }

        // Debug: Show similar entries in cache
        const similarEntries = Array.from(this.cache.keys())
            .filter(key => key.includes(csvSymbol) && key.includes(strike))
            .slice(0, 5);
        
        logger.debug(`Security not found: "${searchPattern}"`, { similarEntries });
        return {
            success: false,
            error: `Security not found for ${searchPattern}`
        };
    }

    reloadCache() {
        this.cache.clear();
        this.loadCache();
    }
}

module.exports = new SecurityLookupService();