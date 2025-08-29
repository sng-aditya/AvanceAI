import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';

const Positions: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5); // in seconds
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedSymbol, setSelectedSymbol] = useState('All');
  const [selectedStrategy, setSelectedStrategy] = useState('All');
  const [positions, setPositions] = useState<any[]>([
    {
      id: 1,
      symbol: 'RELIANCE',
      side: 'Buy',
      quantity: 10,
      avgPrice: 2785.50,
      lastPrice: 2812.25,
      realizedPnL: 0,
      unrealizedPnL: 267.50,
      strategy: 'MA Crossover',
      openedAt: '2023-09-15T09:30:00',
      lastUpdated: '2023-09-15T15:45:00'
    },
    {
      id: 2,
      symbol: 'INFY',
      side: 'Sell',
      quantity: 20,
      avgPrice: 1450.75,
      lastPrice: 1425.80,
      realizedPnL: 0,
      unrealizedPnL: 499.00,
      strategy: 'RSI Divergence',
      openedAt: '2023-09-15T10:15:00',
      lastUpdated: '2023-09-15T15:45:00'
    },
    {
      id: 3,
      symbol: 'HDFCBANK',
      side: 'Buy',
      quantity: 5,
      avgPrice: 1685.25,
      lastPrice: 1660.50,
      realizedPnL: 0,
      unrealizedPnL: -123.75,
      strategy: 'Bollinger Breakout',
      openedAt: '2023-09-15T11:00:00',
      lastUpdated: '2023-09-15T15:45:00'
    }
  ]);
  
  // Available symbols and strategies for filtering
  const symbols = ['All', 'RELIANCE', 'INFY', 'HDFCBANK', 'TCS', 'WIPRO'];
  const strategies = ['All', 'MA Crossover', 'RSI Divergence', 'Bollinger Breakout', 'Momentum Scalping'];

  // Calculate totals
  const totalPositions = positions.length;
  const totalRealizedPnL = positions.reduce((sum, p) => sum + p.realizedPnL, 0);
  const totalUnrealizedPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
  const totalValue = positions.reduce((sum, p) => sum + (p.lastPrice * p.quantity), 0);
  const totalPnL = totalRealizedPnL + totalUnrealizedPnL;

  // Handle refresh
  const refreshData = () => {
    setLastUpdate(new Date());
    
    // Simulate price updates with small random changes
    setPositions(prev => 
      prev.map(position => {
        const priceChange = position.lastPrice * (Math.random() * 0.01 * (Math.random() > 0.5 ? 1 : -1));
        const newPrice = position.lastPrice + priceChange;
        const newUnrealizedPnL = position.side === 'Buy' 
          ? (newPrice - position.avgPrice) * position.quantity
          : (position.avgPrice - newPrice) * position.quantity;
        
        return {
          ...position,
          lastPrice: newPrice,
          unrealizedPnL: newUnrealizedPnL,
          lastUpdated: new Date().toISOString()
        };
      })
    );
  };
  
  // Auto refresh effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      intervalId = setInterval(refreshData, refreshInterval * 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval]);

  // Filter positions based on selected filters
  const filteredPositions = positions.filter(position => {
    const matchesSymbol = selectedSymbol === 'All' || position.symbol === selectedSymbol;
    const matchesStrategy = selectedStrategy === 'All' || position.strategy === selectedStrategy;
    return matchesSymbol && matchesStrategy;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Positions</h1>
        
        <div className="flex items-center mt-4 md:mt-0 space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Auto-refresh:</span>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
          
          {autoRefresh && (
            <select 
              className="input py-1 px-2 text-sm"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              <option value="5">5 sec</option>
              <option value="10">10 sec</option>
              <option value="30">30 sec</option>
              <option value="60">1 min</option>
            </select>
          )}
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          
          <button 
            onClick={refreshData}
            className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1 md:max-w-xs">
          <label htmlFor="symbol-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Symbol
          </label>
          <select
            id="symbol-filter"
            className="input"
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
          >
            {symbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 md:max-w-xs">
          <label htmlFor="strategy-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Strategy
          </label>
          <select
            id="strategy-filter"
            className="input"
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value)}
          >
            {strategies.map(strategy => (
              <option key={strategy} value={strategy}>{strategy}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Positions</div>
          <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{totalPositions}</div>
        </div>
        
        <div className="card p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Realized P&L</div>
          <div className={`mt-1 text-xl font-semibold flex items-center ${
            totalRealizedPnL >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
          }`}>
            <IndianRupee className="h-4 w-4 mr-1" />
            {totalRealizedPnL.toFixed(2)}
          </div>
        </div>
        
        <div className="card p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Unrealized P&L</div>
          <div className={`mt-1 text-xl font-semibold flex items-center ${
            totalUnrealizedPnL >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
          }`}>
            <IndianRupee className="h-4 w-4 mr-1" />
            {totalUnrealizedPnL.toFixed(2)}
          </div>
        </div>
        
        <div className="card p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total P&L</div>
          <div className={`mt-1 text-xl font-semibold flex items-center ${
            totalPnL >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
          }`}>
            <IndianRupee className="h-4 w-4 mr-1" />
            {totalPnL.toFixed(2)}
          </div>
        </div>
      </div>
      
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-head-cell">Symbol</th>
                <th className="table-head-cell">Side</th>
                <th className="table-head-cell text-right">Quantity</th>
                <th className="table-head-cell text-right">Avg. Price</th>
                <th className="table-head-cell text-right">Last Price</th>
                <th className="table-head-cell text-right">Realized P&L</th>
                <th className="table-head-cell text-right">Unrealized P&L</th>
                <th className="table-head-cell">Strategy</th>
                <th className="table-head-cell">Opened At</th>
                <th className="table-head-cell">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredPositions.map((position) => (
                <tr key={position.id} className="table-row">
                  <td className="table-cell font-medium">{position.symbol}</td>
                  <td className={`table-cell ${
                    position.side === 'Buy' ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
                  }`}>
                    {position.side}
                  </td>
                  <td className="table-cell text-right">{position.quantity}</td>
                  <td className="table-cell text-right">₹{position.avgPrice.toFixed(2)}</td>
                  <td className="table-cell text-right">₹{position.lastPrice.toFixed(2)}</td>
                  <td className={`table-cell text-right ${
                    position.realizedPnL >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
                  }`}>
                    ₹{position.realizedPnL.toFixed(2)}
                  </td>
                  <td className={`table-cell text-right ${
                    position.unrealizedPnL >= 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
                  }`}>
                    ₹{position.unrealizedPnL.toFixed(2)}
                  </td>
                  <td className="table-cell">{position.strategy}</td>
                  <td className="table-cell">
                    {new Date(position.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="table-cell">
                    {new Date(position.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
              
              {filteredPositions.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No positions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Positions;