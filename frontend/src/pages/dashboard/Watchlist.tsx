import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ShoppingCart } from 'lucide-react';
import { getWatchlist, removeWatchlistSymbol, WatchlistItem } from '../../utils/api';


// Extending imported WatchlistItem with UI-only fields
interface UIWatchlistItem extends WatchlistItem {
  type?: 'INDEX' | 'STOCK';
  category?: string;
  ltp?: number;
  changePercent?: number;
  change?: number;
  isPositive?: boolean;
}

const Watchlist: React.FC = () => {
  const [watchlist, setWatchlist] = useState<UIWatchlistItem[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const categorizeSymbol = (symbol: string) => {
    const indexes = ['NIFTY_50', 'BANK_NIFTY', 'SENSEX'];
    const largeCap = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'];
    const midCap = ['WIPRO', 'BHARTIARTL'];
    const smallCap = ['SBIN'];
    
    if (indexes.includes(symbol)) {
      return { type: 'INDEX' as const, category: 'Index' };
    } else if (largeCap.includes(symbol)) {
      return { type: 'STOCK' as const, category: 'Large Cap' };
    } else if (midCap.includes(symbol)) {
      return { type: 'STOCK' as const, category: 'Mid Cap' };
    } else if (smallCap.includes(symbol)) {
      return { type: 'STOCK' as const, category: 'Small Cap' };
    } else {
      return { type: 'STOCK' as const, category: 'Other' };
    }
  };

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const data = await getWatchlist();
      if (data.success) {
        const categorizedData = data.data.map((item: WatchlistItem) => {
          const market = item.market || {} as any;
            return {
              ...item,
              ltp: market.ltp,
              change: market.change,
              changePercent: market.changePercent,
              isPositive: market.changePercent ? market.changePercent >= 0 : undefined,
              ...categorizeSymbol(item.symbol)
            } as UIWatchlistItem;
        });
        setWatchlist(categorizedData);
        setLastUpdate(new Date());
      } else {
        console.warn('Watchlist fetch failed');
      }
    } catch (error) {
      console.warn('Failed to fetch watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    try {
      await removeWatchlistSymbol(symbol);
      window.dispatchEvent(new CustomEvent('watchlistUpdated'));
      fetchWatchlist();
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  };

  const refreshData = () => {
    fetchWatchlist();
  };

  useEffect(() => {
    fetchWatchlist();
    const intervalId = setInterval(refreshData, 10000); // 10 seconds
    const handleUpdated = () => fetchWatchlist();
    window.addEventListener('watchlistUpdated', handleUpdated);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('watchlistUpdated', handleUpdated);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Watchlist</h1>
        
        <div className="flex items-center mt-4 md:mt-0 space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <button 
            onClick={refreshData}
            disabled={loading}
            className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Watchlist Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Items</h3>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {watchlist.length}
          </div>
        </div>
        
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gainers</h3>
          <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
            {watchlist.filter(item => item.isPositive).length}
          </div>
        </div>
        
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Losers</h3>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {watchlist.filter(item => !item.isPositive).length}
          </div>
        </div>
      </div>

      {/* Separate Indexes and Stocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Indexes Section */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">📊 Indices</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {watchlist.filter(item => item.type === 'INDEX').length} items
            </div>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-head-cell">Index</th>
                  <th className="table-head-cell text-right">LTP</th>
                  <th className="table-head-cell text-right">Change %</th>
                  <th className="table-head-cell text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {watchlist.filter(item => item.type === 'INDEX').map((item) => (
                  <tr key={item._id} className="table-row hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="table-cell font-medium">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        <span className="font-semibold">{item.symbol}</span>
                      </div>
                    </td>
                    <td className="table-cell text-right font-medium">
                      {item.ltp ? `₹${item.ltp.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className={`table-cell text-right font-medium ${item.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {item.changePercent !== undefined && item.changePercent !== null ? (item.isPositive ? '+' : '') + item.changePercent.toFixed(2) + '%' : 'N/A'}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex space-x-1 justify-end">
                        <button
                          onClick={() => window.open(`/dashboard/charts?symbol=${item.symbol}`, '_blank')}
                          className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-all active:scale-95"
                        >
                          Chart
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchlist(item.symbol);
                          }}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {watchlist.filter(item => item.type === 'INDEX').length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 mb-2 opacity-50">📊</div>
                        <p>No indices in watchlist</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stocks Section */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">📈 Stocks</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {watchlist.filter(item => item.type === 'STOCK').length} items
            </div>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-head-cell">Stock</th>
                  <th className="table-head-cell">Category</th>
                  <th className="table-head-cell text-right">LTP</th>
                  <th className="table-head-cell text-right">Change %</th>
                  <th className="table-head-cell text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {watchlist.filter(item => item.type === 'STOCK').map((item) => (
                  <tr key={item._id} className="table-row hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="table-cell font-medium">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          item.category === 'Large Cap' ? 'bg-green-500' :
                          item.category === 'Mid Cap' ? 'bg-yellow-500' :
                          item.category === 'Small Cap' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="font-semibold">{item.symbol}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.category === 'Large Cap' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        item.category === 'Mid Cap' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        item.category === 'Small Cap' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="table-cell text-right font-medium">
                      {item.ltp ? `₹${item.ltp.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className={`table-cell text-right font-medium ${item.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {item.changePercent !== undefined && item.changePercent !== null ? (item.isPositive ? '+' : '') + item.changePercent.toFixed(2) + '%' : 'N/A'}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex space-x-1 justify-end">
                        <button
                          onClick={() => window.open(`/dashboard/charts?symbol=${item.symbol}`, '_blank')}
                          className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-all active:scale-95"
                        >
                          Chart
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchlist(item.symbol);
                          }}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {watchlist.filter(item => item.type === 'STOCK').length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center">
                        <ShoppingCart className="h-8 w-8 mb-2 opacity-50" />
                        <p>No stocks in watchlist</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watchlist;
