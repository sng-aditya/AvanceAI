import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Activity, BarChart3, Plus, ShoppingCart } from 'lucide-react';
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
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState('');
  const [expiryDates, setExpiryDates] = useState([]);
  const [optionChain, setOptionChain] = useState(null);

  const showExpiryDates = async (symbol) => {
    setSelectedIndex(symbol);
    setShowExpiryModal(true);
    
    try {
      const response = await fetch(`http://localhost:5000/api/market/expiry/${symbol}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setExpiryDates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch expiry dates:', error);
    }
  };

  const fetchOptionChain = async (expiry) => {
    try {
      const response = await fetch(`http://localhost:5000/api/market/option-chain/${selectedIndex}/${expiry}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setOptionChain(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch option chain:', error);
    }
  };
  const [marketData, setMarketData] = useState<{
    summary: MarketSummary;
    indices: MarketItem[];
    topStocks: MarketItem[];
    timestamp: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMarketData = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:5000/api/market/summary');

      if (!response.ok) {
        console.warn(`Market data API returned ${response.status}, keeping last data`);
        // Don't throw error, just keep existing data
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        setMarketData(result.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        console.warn('Market data API failed, keeping last data:', result.message);
        // Keep existing data, don't show error
      }
    } catch (err) {
      console.error('Market data fetch error:', err);
      // Only show error if we don't have any existing data
      if (!marketData) {
        setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      }
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
            <button
              onClick={handleRefresh}
              className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!marketData) {
    return null;
  }

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
          {lastUpdate && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
              {error && <span className="ml-2 text-orange-500">(Market Closed - Showing Last Data)</span>}
            </div>
          )}
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
            {marketData.summary.totalStocks}
          </div>
        </div>
        
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Gainers</h3>
          <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
            {marketData.summary.gainers}
          </div>
        </div>
        
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Losers</h3>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {marketData.summary.losers}
          </div>
        </div>
        
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Gainer</h3>
          {marketData.summary.topGainer ? (
            <div className="mt-2">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {marketData.summary.topGainer.symbol}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                +{marketData.summary.topGainer.changePercent?.toFixed(2)}%
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
            {marketData.indices.map((index) => (
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
                      e.target.classList.add('animate-pulse');
                      setTimeout(() => e.target.classList.remove('animate-pulse'), 300);
                      addToWatchlist?.(index.symbol);
                    }}
                    className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-all active:scale-95"
                  >
                    + Watchlist
                  </button>
                  <button
                    onClick={(e) => {
                      e.target.classList.add('animate-pulse');
                      setTimeout(() => e.target.classList.remove('animate-pulse'), 300);
                      showExpiryDates(index.symbol);
                    }}
                    className="flex-1 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-all active:scale-95"
                  >
                    📅 Options
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
              {marketData.topStocks.map((stock) => (
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
                          e.target.classList.add('animate-pulse');
                          setTimeout(() => e.target.classList.remove('animate-pulse'), 300);
                          window.open(`/dashboard/charts?symbol=${stock.symbol}`, '_blank');
                        }}
                        className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-all active:scale-95"
                      >
                        Watch
                      </button>
                      <button
                        onClick={(e) => {
                          e.target.classList.add('animate-pulse');
                          setTimeout(() => e.target.classList.remove('animate-pulse'), 300);
                          addToWatchlist?.(stock.symbol);
                        }}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-all active:scale-95"
                      >
                        + Watchlist
                      </button>
                      <button
                        onClick={(e) => {
                          e.target.classList.add('animate-pulse');
                          setTimeout(() => e.target.classList.remove('animate-pulse'), 300);
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
    
    {/* Enhanced Expiry & Options Modal */}
    {showExpiryModal && (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl mx-4 h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedIndex}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Options & Expiry Analysis</p>
            </div>
            <button 
              onClick={() => setShowExpiryModal(false)} 
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
              {/* Expiry Dates Sidebar */}
              <div className="lg:col-span-2 border-r border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center mb-4">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">📅 Expiry Dates</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                    {expiryDates.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-[calc(85vh-200px)] overflow-auto">
                  {expiryDates.map((date, index) => {
                    const dateObj = new Date(date);
                    const today = new Date();
                    const daysToExpiry = Math.ceil((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Determine if it's weekly or monthly based on actual date patterns
                    // Weekly options typically expire on Thursdays, monthly on last Thursday of month
                    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 4 = Thursday
                    const isThursday = dayOfWeek === 4;
                    const isLastThursday = isThursday && (dateObj.getDate() + 7 > new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate());
                    
                    // More accurate classification based on time to expiry
                    const isWeekly = daysToExpiry <= 35 && !isLastThursday;
                    
                    return (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.target.classList.add('animate-pulse');
                          setTimeout(() => e.target.classList.remove('animate-pulse'), 200);
                          fetchOptionChain(date);
                        }}
                        className="w-full text-left p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 active:scale-98"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {date}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              isWeekly ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            }`}>
                              {isWeekly ? 'Weekly' : 'Monthly'}
                            </div>
                            <div className={`text-xs mt-1 ${
                              daysToExpiry < 0 ? 'text-red-500' : daysToExpiry <= 7 ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {daysToExpiry < 0 ? `${Math.abs(daysToExpiry)}d ago` : `${daysToExpiry}d`}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Option Chain */}
              <div className="lg:col-span-3 p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">📊 Option Chain</span>
                  {optionChain && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full">
                      Live Data
                    </span>
                  )}
                </div>
                
                {optionChain ? (
                  <div className="space-y-3 max-h-[calc(85vh-200px)] overflow-auto">
                    {/* Show underlying price */}
                    {optionChain.underlying_price && (
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-700 mb-4">
                        <div className="text-center">
                          <span className="text-sm text-blue-600 dark:text-blue-400">Underlying Price</span>
                          <div className="text-xl font-bold text-blue-800 dark:text-blue-300">
                            ₹{optionChain.underlying_price?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                    {Object.entries(optionChain.option_chain || optionChain).slice(0, 15).map(([strike, data]) => (
                      <div key={strike} className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all">
                        <div className="text-center mb-3">
                          <span className="text-lg font-bold text-gray-900 dark:text-white bg-yellow-100 dark:bg-yellow-900 px-3 py-1 rounded-full">
                            ₹{parseFloat(strike).toFixed(0)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {/* CALL Option */}
                          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-3 rounded-lg border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-green-800 dark:text-green-300">📈 CALL</span>
                              <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                CE
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">LTP:</span>
                                <span className="font-semibold text-green-700 dark:text-green-300">
                                  ₹{data.ce?.last_price?.toFixed(2) || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">OI:</span>
                                <span className="font-medium">{data.ce?.oi?.toLocaleString() || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Vol:</span>
                                <span className="font-medium">{data.ce?.volume?.toLocaleString() || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* PUT Option */}
                          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-3 rounded-lg border border-red-200 dark:border-red-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-red-800 dark:text-red-300">📉 PUT</span>
                              <span className="text-xs bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                                PE
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">LTP:</span>
                                <span className="font-semibold text-red-700 dark:text-red-300">
                                  ₹{data.pe?.last_price?.toFixed(2) || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">OI:</span>
                                <span className="font-medium">{data.pe?.oi?.toLocaleString() || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Vol:</span>
                                <span className="font-medium">{data.pe?.volume?.toLocaleString() || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    <div className="text-6xl mb-4">📅</div>
                    <p className="text-lg font-medium">Select an expiry date</p>
                    <p className="text-sm">Choose from the expiry dates to view option chain</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default MarketData;
