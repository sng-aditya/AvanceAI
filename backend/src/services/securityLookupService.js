const fs = require('fs');
const path = require('path');

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
                console.log('⚠️ Security_Id.csv not found, creating empty cache');
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

            console.log(`🔍 Security Cache: ✅ Loaded ${loadedCount} securities`);
        } catch (error) {
            console.error('❌ Error loading security cache:', error.message);
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
        
        // Format expiry date to match CSV format (e.g., "23 SEP")
        const expiryDate = new Date(expiry);
        const day = expiryDate.getDate();
        const month = expiryDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const formattedExpiry = `${day} ${month}`;
        
        const searchPattern = `${csvSymbol} ${formattedExpiry} ${strike} ${csvOptionType}`;

        if (this.cache.has(searchPattern)) {
            return {
                success: true,
                data: {
                    securityId: this.cache.get(searchPattern),
                    displayName: searchPattern,
                    exchangeSegment: 'NSE_FNO',
                    instrument: 'OPTIDX'
                }
            };
        }

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