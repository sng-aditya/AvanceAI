import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface Holding {
  exchange: string;
  tradingSymbol: string;
  securityId: string;
  isin: string;
  totalQty: number;
  dpQty: number;
  t1Qty: number;
  mtf_t1_qty: number;
  mtf_qty: number;
  availableQty: number;
  collateralQty: number;
  avgCostPrice: number;
  lastTradedPrice: number;
}

const Holdings: React.FC = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch holdings from API
  const fetchHoldings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/market/holdings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setHoldings(data.data || []);
        setLastUpdate(new Date());
      } else {
        setError(data.error || 'Failed to fetch holdings');
      }
    } catch (err) {
      setError('Network error while fetching holdings');
    } finally {
      setLoading(false);
    }
  };

  // Calculate P&L
  const calculatePnL = (holding: Holding) => {
    return (holding.lastTradedPrice - holding.avgCostPrice) * holding.totalQty;
  };

  // Calculate totals
  const totalHoldings = holdings.length;
  const totalValue = holdings.reduce((sum, h) => sum + (h.lastTradedPrice * h.totalQty), 0);
  const totalInvestment = holdings.reduce((sum, h) => sum + (h.avgCostPrice * h.totalQty), 0);
  const totalPnL = totalValue - totalInvestment;

  // Initial fetch only
  useEffect(() => {
    fetchHoldings();
  }, []);

  // Listen for holdings events
  useEffect(() => {
    const handleHoldingsUpdate = () => {
      fetchHoldings();
    };

    const handleOrderEvent = () => {
      fetchHoldings();
    };

  window.addEventListener('holdingsUpdate', handleHoldingsUpdate);
  window.addEventListener('orderExecuted', handleOrderEvent);
  window.addEventListener('orderPlaced', handleOrderEvent);
    
    return () => {
  window.removeEventListener('holdingsUpdate', handleHoldingsUpdate);
  window.removeEventListener('orderExecuted', handleOrderEvent);
  window.removeEventListener('orderPlaced', handleOrderEvent);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Holdings</h1>
        
        <div className="flex items-center mt-4 md:mt-0 space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          
          <button 
            onClick={fetchHoldings}
            disabled={loading}
            className="flex items-center px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh Holdings
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
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Holdings</div>
          <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{totalHoldings}</div>
        </div>
        
        <div className="card p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Investment</div>
          <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">₹{totalInvestment.toFixed(2)}</div>
        </div>
        
        <div className="card p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Value</div>
          <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">₹{totalValue.toFixed(2)}</div>
        </div>
        
        <div className="card p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total P&L</div>
          <div className={`mt-1 text-xl font-semibold ${
            totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            ₹{totalPnL.toFixed(2)}
          </div>
        </div>
      </div>
      
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-head-cell">Trading Symbol</th>
                <th className="table-head-cell">Exchange</th>
                <th className="table-head-cell text-right">Total Qty</th>
                <th className="table-head-cell text-right">Available Qty</th>
                <th className="table-head-cell text-right">Avg Cost Price</th>
                <th className="table-head-cell text-right">Last Traded Price</th>
                <th className="table-head-cell text-right">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading holdings...
                  </td>
                </tr>
              ) : holdings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No holdings found
                  </td>
                </tr>
              ) : (
                holdings.map((holding, index) => {
                  const pnl = calculatePnL(holding);
                  return (
                    <tr key={index} className="table-row">
                      <td className="table-cell font-medium">{holding.tradingSymbol}</td>
                      <td className="table-cell">{holding.exchange}</td>
                      <td className="table-cell text-right">{holding.totalQty}</td>
                      <td className="table-cell text-right">{holding.availableQty}</td>
                      <td className="table-cell text-right">₹{holding.avgCostPrice?.toFixed(2) || '0.00'}</td>
                      <td className="table-cell text-right">₹{holding.lastTradedPrice?.toFixed(2) || '0.00'}</td>
                      <td className={`table-cell text-right ${
                        pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        ₹{pnl.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Holdings;