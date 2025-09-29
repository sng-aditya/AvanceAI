const EventEmitter = require('events');

class APIQueue extends EventEmitter {
    constructor() {
        super();
        this.queues = new Map(); // Different queues for different API types
        this.processing = new Map(); // Track which queues are processing
        this.lastRequestTimes = new Map(); // Track last request times per API type
        
        // Rate limits per API type (in milliseconds)
        this.rateLimits = {
            'market_data': 1000,      // 1 second for real-time market data
            'positions': 3000,        // 3 seconds for positions
            'holdings': 3000,         // 3 seconds for holdings  
            'balance': 5000,          // 5 seconds for balance
            'orders': 2000,           // 2 seconds for orders
            'option_chain': 3000,     // 3 seconds for option chain
            'expiry_dates': 5000,     // 5 seconds for expiry dates
            'strike_ohlc': 2000       // 2 seconds for strike OHLC data
        };
        
        // Initialize queues
        Object.keys(this.rateLimits).forEach(apiType => {
            this.queues.set(apiType, []);
            this.processing.set(apiType, false);
            this.lastRequestTimes.set(apiType, 0);
        });
    }

    // Add request to queue
    enqueue(apiType, requestFn, priority = 'normal') {
        return new Promise((resolve, reject) => {
            const request = {
                fn: requestFn,
                resolve,
                reject,
                priority,
                timestamp: Date.now()
            };

            const queue = this.queues.get(apiType);
            if (!queue) {
                return reject(new Error(`Unknown API type: ${apiType}`));
            }

            // Insert based on priority
            if (priority === 'high') {
                queue.unshift(request);
            } else {
                queue.push(request);
            }

            this.processQueue(apiType);
        });
    }

    // Process queue for specific API type
    async processQueue(apiType) {
        if (this.processing.get(apiType)) {
            return; // Already processing this queue
        }

        const queue = this.queues.get(apiType);
        if (!queue || queue.length === 0) {
            return;
        }

        this.processing.set(apiType, true);

        while (queue.length > 0) {
            const request = queue.shift();
            
            try {
                // Check rate limit
                const now = Date.now();
                const lastRequest = this.lastRequestTimes.get(apiType);
                const rateLimit = this.rateLimits[apiType];
                const timeSinceLastRequest = now - lastRequest;

                if (timeSinceLastRequest < rateLimit) {
                    const waitTime = rateLimit - timeSinceLastRequest;
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }

                // Execute request
                this.lastRequestTimes.set(apiType, Date.now());
                const result = await request.fn();
                request.resolve(result);

            } catch (error) {
                request.reject(error);
            }
        }

        this.processing.set(apiType, false);
    }

    // Get queue status
    getStatus() {
        const status = {};
        for (const [apiType, queue] of this.queues) {
            status[apiType] = {
                queueLength: queue.length,
                processing: this.processing.get(apiType),
                lastRequest: this.lastRequestTimes.get(apiType),
                rateLimit: this.rateLimits[apiType]
            };
        }
        return status;
    }

    // Clear all queues
    clearAll() {
        for (const queue of this.queues.values()) {
            queue.length = 0;
        }
    }
}

module.exports = new APIQueue();
