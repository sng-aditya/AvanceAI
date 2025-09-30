import React, { useState, useEffect } from 'react';
import { RefreshCw, IndianRupee, AlertCircle } from 'lucide-react';
import { authenticatedFetch } from '../../utils/api';

interface Position {
  tradingSymbol: string;
  positionType: 'LONG' | 'SHORT' | 'CLOSED';
  productType: string;
  netQty: number;
  buyAvg: number;
  costPrice: number;
  unrealizedProfit: number;
  realizedProfit: number;
}

const Positions: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch positions from API
  const fetchPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticatedFetch('/market/positions');
      const data = await response.json();
      
      if (data.success) {
        setPositions(data.data || []);
        setLastUpdate(new Date());
      } else {
        setError(data.error || 'Failed to fetch positions');
      }
    } catch (err) {
      setError('Network error while fetching positions');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalPositions = positions.length;
  const totalRealizedPnL = positions.reduce((sum, p) => sum + (p.realizedProfit || 0), 0);
  const totalUnrealizedPnL = positions.reduce((sum, p) => sum + (p.unrealizedProfit || 0), 0);
  const totalPnL = totalRealizedPnL + totalUnrealizedPnL;
  
  // Initial fetch only
  useEffect(() => {
    fetchPositions();
  }, []);

  // Listen for position/holding events
  useEffect(() => {
    const handlePositionUpdate = () => {
      fetchPositions();
    };

    const handleOrderEvent = () => {
      fetchPositions();
    };

    // Listen for custom events that might trigger position updates
  window.addEventListener('positionUpdate', handlePositionUpdate);
  window.addEventListener('orderExecuted', handleOrderEvent);
  window.addEventListener('orderPlaced', handleOrderEvent);
    
    return () => {
  window.removeEventListener('positionUpdate', handlePositionUpdate);
  window.removeEventListener('orderExecuted', handleOrderEvent);
  window.removeEventListener('orderPlaced', handleOrderEvent);
    };
  }, []);

  const getPositionTypeColor = (positionType: string) => {
    switch (positionType) {
      case 'LONG': return 'text-green-600 dark:text-green-400';
      case 'SHORT': return 'text-red-600 dark:text-red-400';
      case 'CLOSED': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Positions</h1>
        
        <div className="flex items-center mt-4 md:mt-0 space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          
          <button 
            onClick={fetchPositions}
            disabled={loading}
            className="flex items-center px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh Positions
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}
      
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
                <th className="table-head-cell">Trading Symbol</th>
                <th className="table-head-cell">Position Type</th>
                <th className="table-head-cell">Product Type</th>
                <th className="table-head-cell text-right">Net Qty</th>
                <th className="table-head-cell text-right">Buy Avg Price</th>
                <th className="table-head-cell text-right">Cost Price</th>
                <th className="table-head-cell text-right">Unrealized P&L</th>
                <th className="table-head-cell text-right">Realized P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading positions...
                  </td>
                </tr>
              ) : positions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No positions found
                  </td>
                </tr>
              ) : (
                positions.map((position, index) => (
                  <tr key={index} className="table-row">
                    <td className="table-cell font-medium">{position.tradingSymbol}</td>
                    <td className={`table-cell font-medium ${getPositionTypeColor(position.positionType)}`}>
                      {position.positionType}
                    </td>
                    <td className="table-cell">{position.productType}</td>
                    <td className="table-cell text-right">{position.netQty}</td>
                    <td className="table-cell text-right">₹{position.buyAvg?.toFixed(2) || '0.00'}</td>
                    <td className="table-cell text-right">₹{position.costPrice?.toFixed(2) || '0.00'}</td>
                    <td className={`table-cell text-right ${
                      (position.unrealizedProfit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      ₹{position.unrealizedProfit?.toFixed(2) || '0.00'}
                    </td>
                    <td className={`table-cell text-right ${
                      (position.realizedProfit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      ₹{position.realizedProfit?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Positions;