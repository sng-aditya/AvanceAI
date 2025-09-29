import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, RefreshCw, Activity, BarChart3, ShoppingCart } from 'lucide-react';


import { authenticatedFetch } from '../../utils/api';

interface MarketItem {
  symbol: string;
  name: string;
  ltp: number;
  change?: number;
  changePercent?: number;
  open?: number;
  high?: number;
  low?: number;
  prevClose?: number;
  isPositive?: boolean;
}

interface MarketSummary {
  totalStocks: number;
  gainers: number;
  losers: number;
  topGainer: MarketItem | null;
  topLoser: MarketItem | null;
}

interface MarketDataProps {
  refreshInterval?: number;
  addToWatchlist?: (symbol: string) => void;
  onStockClick?: (stock: MarketItem) => void;
}

const MarketData: React.FC<MarketDataProps> = ({ refreshInterval = 30000, addToWatchlist, onStockClick }) => {
  const navigate = useNavigate();


  const [marketData, setMarketData] = useState<{
    summary: MarketSummary;
    indices: MarketItem[];
    topStocks: MarketItem[];
    timestamp: string;
    source?: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMarketData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to view market data');
        setLoading(false);
        return;
      }

      const response = await authenticatedFetch('/market/summary');
      
      if (response.status === 401) {
        setError('Session expired - please login again');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        setError(`Server error: ${response.status}`);
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        setMarketData({...result.data, source: result.source});
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch market data');
      }
      } catch (err) {
      setError('Connection failed - check if backend is running');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchMarketData();
  };

  useEffect(() => {
    fetchMarketData();
    
    const interval = setInterval(fetchMarketData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const icon = isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
    
    return (
      <div className={`flex items-center ${color}`}>
        {icon}
        <span className="ml-1">
          {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
      </div>
    );
  };

  if (loading && !marketData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading market data...</span>
        </div>
      </div>
    );
  }

  if (error && !marketData) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-red-600 dark:text-red-400">
              <Activity className="h-5 w-5 mr-2" />
              <span>Market Data Error</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={async () => {
                  try {
                    const response = await authenticatedFetch('/test');
                    const result = await response.json();
                    alert(`Backend Test: ${result.success ? 'OK' : 'FAIL'}\nMessage: ${result.message}`);
                  } catch (err) {
                    const message = err instanceof Error ? err.message : 'Unknown error';
                    alert('Backend connection failed: ' + message);
                  }
                }}
                className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <Activity className="h-4 w-4 mr-1" />
                Test
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // Minimal empty fallback (no synthetic values)
  const displayData = marketData || { summary: { totalStocks: 0, gainers: 0, losers: 0, topGainer: null, topLoser: null }, indices: [], topStocks: [], timestamp: new Date().toISOString(), source: 'no_data' };

  return (
    <>
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="h-6 w-6 mr-2" />
          Live Market Feed
        </h2>
        
        <div className="flex items-center mt-4 md:mt-0 space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {lastUpdate ? `Last updated: ${lastUpdate.toLocaleTimeString()}` : 'No data yet'}
            <span className="ml-2 text-blue-600 font-medium">({displayData.source || 'unknown'})</span>
            {error && <span className="ml-2 text-orange-500">(Error: {error})</span>}
          </div>
          <button 
            onClick={async () => {
              try {
                // Test basic connectivity first
                const testResponse = await authenticatedFetch('/test');
                const testResult = await testResponse.json();
                
                // Test auth
                const authTest = await authenticatedFetch('/auth/me');
                
                // Test WebSocket status
                const wsResponse = await authenticatedFetch('/market/websocket-status');
                const wsResult = await wsResponse.json();
                
                alert(`Connection Test:\nBackend: ${testResult.success ? 'OK' : 'FAIL'}\nAuth: ${authTest.ok ? 'OK' : 'FAIL'}\nWebSocket: ${wsResult.data.isConnected ? 'Connected' : 'Disconnected'}\nData Items: ${wsResult.data.totalCacheItems}`);
              } catch (error) {
                const msg = (error as any)?.message || 'Unknown error';
                alert('Connection failed: ' + msg);
              }
            }}
            className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Activity className="h-4 w-4 mr-1" />
            Test
          </button>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Market Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Stocks</h3>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {displayData.summary.totalStocks}
          </div>
        </div>
        
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gainers</h3>
          <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
            {displayData.summary.gainers}
          </div>
        </div>
        
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Losers</h3>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {displayData.summary.losers}
          </div>
        </div>
        
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Gainer</h3>
          {displayData.summary.topGainer ? (
            <div className="mt-2">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {displayData.summary.topGainer.symbol}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                +{displayData.summary.topGainer.changePercent?.toFixed(2)}%
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">N/A</div>
          )}
        </div>
      </div>

      {/* Indices */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Market Indices</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayData.indices.map((index) => (
              <div 
                key={index.symbol} 
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{index.symbol}</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(index.ltp)}
                    </div>
                  </div>
                  <div className="text-right">
                    {index.change !== undefined && index.changePercent !== undefined && (
                      formatChange(index.change, index.changePercent)
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      (e.currentTarget as HTMLElement).classList.add('animate-pulse');
                      setTimeout(() => (e.currentTarget as HTMLElement).classList.remove('animate-pulse'), 300);
                      addToWatchlist?.(index.symbol);
                      // Show feedback message
                      const notification = document.createElement('div');
                      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                      notification.textContent = 'Added to watchlist';
                      document.body.appendChild(notification);
                      setTimeout(() => {
                        if (document.body.contains(notification)) {
                          document.body.removeChild(notification);
                        }
                      }, 3000);
                    }}
                    className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-all active:scale-95"
                  >
                    + Watchlist
                  </button>
                  <button
                    onClick={(e) => {
                      (e.currentTarget as HTMLElement).classList.add('animate-pulse');
                      setTimeout(() => (e.currentTarget as HTMLElement).classList.remove('animate-pulse'), 300);
                      navigate(`/dashboard/charts?symbol=${index.symbol}`);
                    }}
                    className="flex-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-all active:scale-95"
                  >
                    Chart
                  </button>
                  <button
                    onClick={(e) => {
                      (e.currentTarget as HTMLElement).classList.add('animate-pulse');
                      setTimeout(() => (e.currentTarget as HTMLElement).classList.remove('animate-pulse'), 300);
                      navigate(`/dashboard/option-chain?symbol=${index.symbol}`);
                    }}
                    className="flex-1 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-all active:scale-95"
                  >
                    📅 Option Chain
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Stocks */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Top Stocks</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-head-cell">Symbol</th>
                <th className="table-head-cell text-right">LTP</th>
                <th className="table-head-cell text-right">Change</th>
                <th className="table-head-cell text-right">High</th>
                <th className="table-head-cell text-right">Low</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {displayData.topStocks.map((stock) => (
                <tr key={stock.symbol} className="table-row hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="table-cell font-semibold">
                    <div className="flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-2 text-blue-600" />
                      {stock.symbol}
                    </div>
                  </td>
                  <td className="table-cell text-right font-medium">
                    {formatCurrency(stock.ltp)}
                  </td>
                  <td className="table-cell text-right">
                    {stock.change !== undefined && stock.changePercent !== undefined ? (
                      formatChange(stock.change, stock.changePercent)
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="table-cell text-right">
                    {stock.high ? formatCurrency(stock.high) : 'N/A'}
                  </td>
                  <td className="table-cell text-right">
                    {stock.low ? formatCurrency(stock.low) : 'N/A'}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex space-x-1 justify-end">
                      <button
                        onClick={(e) => {
                          (e.currentTarget as HTMLElement).classList.add('animate-pulse');
                          setTimeout(() => (e.currentTarget as HTMLElement).classList.remove('animate-pulse'), 300);
                          window.open(`/dashboard/charts?symbol=${stock.symbol}`, '_blank');
                        }}
                        className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-all active:scale-95"
                      >
                        Chart
                      </button>
                      <button
                        onClick={(e) => {
                          (e.currentTarget as HTMLElement).classList.add('animate-pulse');
                          setTimeout(() => (e.currentTarget as HTMLElement).classList.remove('animate-pulse'), 300);
                          addToWatchlist?.(stock.symbol);
                          // Show feedback message
                          const notification = document.createElement('div');
                          notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                          notification.textContent = 'Added to watchlist';
                          document.body.appendChild(notification);
                          setTimeout(() => {
                            if (document.body.contains(notification)) {
                              document.body.removeChild(notification);
                            }
                          }, 3000);
                        }}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-all active:scale-95"
                      >
                        + Watchlist
                      </button>
                      <button
                        onClick={(e) => {
                          (e.currentTarget as HTMLElement).classList.add('animate-pulse');
                          setTimeout(() => (e.currentTarget as HTMLElement).classList.remove('animate-pulse'), 300);
                          onStockClick?.(stock);
                        }}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-all active:scale-95"
                      >
                        Order
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    </>
  );
};

export default MarketData;
