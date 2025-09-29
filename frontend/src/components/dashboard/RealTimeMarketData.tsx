import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, RefreshCw, Activity, BarChart3, Zap } from 'lucide-react';
import { useRealTimeData } from '../../hooks/useRealTimeData';

interface MarketDataProps {
  addToWatchlist?: (symbol: string) => void;
  onStockClick?: (stock: any) => void;
}

const RealTimeMarketData: React.FC<MarketDataProps> = ({ addToWatchlist, onStockClick }) => {
  const { data, loading, error, connectionStatus, refresh } = useRealTimeData(1000);
  const navigate = useNavigate();

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

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Connecting to real-time feed...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-red-600 dark:text-red-400">
              <Activity className="h-5 w-5 mr-2" />
              <span>Real-time Feed Error</span>
            </div>
            <button
              onClick={refresh}
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

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header with Real-time Status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <Zap className="h-6 w-6 mr-2 text-yellow-500" />
          Real-time Market Feed
        </h2>
        
        <div className="flex items-center mt-4 md:mt-0 space-x-4">
          <div className={`flex items-center text-sm ${getConnectionStatusColor()}`}>
            <div className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse"></div>
            <span className="capitalize">{connectionStatus}</span>
          </div>
          
          {data.lastUpdate && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last: {new Date(data.lastUpdate).toLocaleTimeString()}
            </div>
          )}
          
          <div className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
            {data.source} • {data.count} instruments
          </div>
          
          <button 
            onClick={refresh}
            disabled={loading}
            className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Market Indices */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Market Indices (Real-time)
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.indices.map((index) => (
              <div 
                key={index.symbol} 
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-l-4 border-blue-500"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{index.symbol}</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(index.ltp)}
                    </div>
                  </div>
                  <div className="text-right">
                    {formatChange(index.change, index.changePercent)}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Vol: {index.volume?.toLocaleString() || 'N/A'}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => addToWatchlist?.(index.symbol)}
                    className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-all active:scale-95"
                  >
                    + Watchlist
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/option-chain?symbol=${index.symbol}`)}
                    className="flex-1 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-all active:scale-95"
                  >
                    Options
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Top Stocks (Real-time)
          </h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-head-cell">Symbol</th>
                <th className="table-head-cell text-right">LTP</th>
                <th className="table-head-cell text-right">Change</th>
                <th className="table-head-cell text-right">Volume</th>
                <th className="table-head-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {data.stocks.map((stock) => (
                <tr key={stock.symbol} className="table-row hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="table-cell font-semibold">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${stock.isPositive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      {stock.symbol}
                    </div>
                  </td>
                  <td className="table-cell text-right font-medium">
                    {formatCurrency(stock.ltp)}
                  </td>
                  <td className="table-cell text-right">
                    {formatChange(stock.change, stock.changePercent)}
                  </td>
                  <td className="table-cell text-right text-sm text-gray-600 dark:text-gray-400">
                    {stock.volume?.toLocaleString() || 'N/A'}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex space-x-1 justify-end">
                      <button
                        onClick={() => addToWatchlist?.(stock.symbol)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-all active:scale-95"
                      >
                        + Watch
                      </button>
                      <button
                        onClick={() => onStockClick?.(stock)}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-all active:scale-95"
                      >
                        Trade
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
  );
};

export default RealTimeMarketData;