# Quick Reference: Stock Chart Feature

## What Changed?

### Before
- User clicks "Chart" button → Opens TradingView in new page
- No custom charts for stocks/indices
- Only option strikes had OHLC charts

### After  
- User clicks "Chart" button → Opens **custom OHLC candlestick chart**
- Uses real Dhan API data
- Same chart component as option chain
- Time range selector: 1d, 3d, 5d, 1w, 1m

## API Endpoint

### Request
```
GET /api/market/stock-ohlc/:symbol?fromDate=2025-10-03&toDate=2025-10-03
```

### Example
```
GET /api/market/stock-ohlc/RELIANCE?fromDate=2025-10-03&toDate=2025-10-03
```

### Supported Symbols
**Indices**: NIFTY_50, BANK_NIFTY, SENSEX  
**Stocks**: RELIANCE, TCS, HDFCBANK, INFY, WIPRO, ICICIBANK, SBIN, BHARTIARTL

### Response
```json
{
  "success": true,
  "data": {
    "timestamp": [1696320000, 1696320060],
    "open": [2850.50, 2851.20],
    "high": [2855.30, 2854.80],
    "low": [2848.90, 2850.10],
    "close": [2852.40, 2853.50],
    "volume": [125000, 130000]
  },
  "source": "api_historical",
  "metadata": {
    "symbol": "RELIANCE",
    "securityId": "2885",
    "exchangeSegment": "NSE_EQ",
    "instrument": "EQUITY",
    "fromDate": "2025-10-03",
    "toDate": "2025-10-03"
  }
}
```

## UI Flow

```
Landing Page (After Login)
  ↓
Market Data (3 indices + 9 stocks)
  ↓
User clicks "Chart" button
  ↓
Navigate to: /dashboard/stock-chart?symbol=RELIANCE
  ↓
StockChart Component:
  - Fetches OHLC data from backend
  - Displays candlestick chart
  - Shows price statistics
  - Time range selector
```

## Time Ranges

| Button | Label | Date Range |
|--------|-------|------------|
| 1d | 1 Day | Today only (intraday) |
| 3d | 3 Days | Last 3 days |
| 5d | 5 Days | Last 5 days |
| 1w | 1 Week | Last 7 days |
| 1m | 1 Month | Last 30 days |

## Button Locations

### RealTimeMarketData Component (Landing page after login)
- **Indices**: Added "Chart" button (green) between "Watchlist" and "Options"
- **Stocks**: Added "Chart" button (purple) in actions column

### MarketData Component (Dashboard page)
- **Indices**: Updated "Chart" button to use new route
- **Stocks**: Updated "Chart" button to use new route

## Security ID Mapping

The backend route has a hardcoded mapping:

```javascript
const securityMapping = {
  // Indices
  'NIFTY_50': { securityId: '13', exchangeSegment: 'IDX_I', instrument: 'INDEX' },
  'BANK_NIFTY': { securityId: '25', exchangeSegment: 'IDX_I', instrument: 'INDEX' },
  'SENSEX': { securityId: '51', exchangeSegment: 'IDX_I', instrument: 'INDEX' },
  
  // Stocks
  'RELIANCE': { securityId: '2885', exchangeSegment: 'NSE_EQ', instrument: 'EQUITY' },
  'TCS': { securityId: '11536', exchangeSegment: 'NSE_EQ', instrument: 'EQUITY' },
  'HDFCBANK': { securityId: '1333', exchangeSegment: 'NSE_EQ', instrument: 'EQUITY' },
  'INFY': { securityId: '1594', exchangeSegment: 'NSE_EQ', instrument: 'EQUITY' },
  'WIPRO': { securityId: '3787', exchangeSegment: 'NSE_EQ', instrument: 'EQUITY' },
  'ICICIBANK': { securityId: '4963', exchangeSegment: 'NSE_EQ', instrument: 'EQUITY' },
  'SBIN': { securityId: '3045', exchangeSegment: 'NSE_EQ', instrument: 'EQUITY' },
  'BHARTIARTL': { securityId: '10604', exchangeSegment: 'NSE_EQ', instrument: 'EQUITY' }
};
```

## Key Features

✅ Custom candlestick charts  
✅ Real-time price display with change %  
✅ OHLV statistics (Open, High, Low, Volume)  
✅ Time range selector  
✅ Loading states  
✅ Error handling  
✅ Dark mode support  
✅ Back button  
✅ Refresh button  
✅ Responsive design  

## Not Modified

❌ Option Chain section (unchanged)  
❌ Strike OHLC functionality (unchanged)  
❌ WebSocket for option strikes (unchanged)  
❌ Expiry data handling (unchanged)  

## Testing

To test, run both backend and frontend:

```bash
# Backend
cd backend
npm start

# Frontend  
cd frontend
npm run dev
```

Then:
1. Login at http://localhost:5173/login
2. See market data on landing page
3. Click "Chart" button on any stock/index
4. Verify candlestick chart displays
5. Try different time ranges
6. Check error handling by trying invalid symbol

## Adding More Stocks

To add a new stock (e.g., TATAMOTORS):

1. Find security ID from Dhan master CSV
2. Add to `securityMapping` in `backend/src/routes/marketData.js`:
   ```javascript
   'TATAMOTORS': { securityId: 'XXXX', exchangeSegment: 'NSE_EQ', instrument: 'EQUITY' }
   ```
3. Add to WebSocket subscription in `backend/src/services/websocketService.js` (optional)
4. Stock will automatically appear if added to market data sources

## Troubleshooting

**Issue**: Chart doesn't load  
**Solution**: Check backend logs for API errors, verify security ID mapping

**Issue**: "Security not found"  
**Solution**: Symbol must be in UPPERCASE and match mapping exactly

**Issue**: No data for selected date range  
**Solution**: Market closed or no trading data available for those dates

**Issue**: Time range button doesn't work  
**Solution**: Check browser console for fetch errors, verify backend route
