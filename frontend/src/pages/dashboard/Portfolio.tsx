import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Wallet, ShoppingCart, History } from 'lucide-react';
import OrderHistory from '../../components/trading/OrderHistory';
import { authenticatedFetch } from '../../utils/api';

interface BalanceData {
  availabelBalance: number;
  withdrawableBalance: number;
}

const Portfolio: React.FC = () => {
  const [balance, setBalance] = useState<BalanceData>({ availabelBalance: 0, withdrawableBalance: 0 });
  const [positions, setPositions] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  // Enhanced throttle control with staggered delays to prevent API rate limiting
  const lastFetchRef = useRef<{[k:string]: number}>({});
  const COOLDOWN_MS = {
    balance: 8000,    // 8 seconds for balance (less frequent)
    positions: 4000,  // 4 seconds for positions
    holdings: 4000    // 4 seconds for holdings
  };

  const canFetch = (key: string) => {
    const now = Date.now();
    const last = lastFetchRef.current[key] || 0;
    const cooldown = COOLDOWN_MS[key as keyof typeof COOLDOWN_MS] || 5000;
    if (now - last < cooldown) return false;
    lastFetchRef.current[key] = now;
    return true;
  };

  const forceMark = (key: string) => {
    lastFetchRef.current[key] = Date.now();
  };

  const fetchBalance = async (forced = false) => {
    if (!forced && !canFetch('balance')) return;
    try {
      const response = await authenticatedFetch('/market/balance');
      const data = await response.json();
      if (data.success) {
        setBalance(data.data);
      }
    } catch (error) {
      console.warn('Failed to fetch balance, keeping existing data:', error);
    }
  };

  const fetchPositions = async (forced = false) => {
    if (!forced && !canFetch('positions')) return;
    try {
      const response = await authenticatedFetch('/market/positions');
      const data = await response.json();
      if (data.success) {
        setPositions(data.data || []);
      } else {
        setPositions([]);
        console.log('Positions not available:', data.error);
      }
    } catch (error) {
      setPositions([]);
      console.warn('Failed to fetch positions:', error);
    }
  };

  const fetchHoldings = async (forced = false) => {
    if (!forced && !canFetch('holdings')) return;
    try {
      const response = await authenticatedFetch('/market/holdings');
      const data = await response.json();
      if (data.success) {
        setHoldings(data.data || []);
      } else {
        setHoldings([]);
        console.log('Holdings not available:', data.error);
      }
    } catch (error) {
      setHoldings([]);
      console.warn('Failed to fetch holdings:', error);
    }
  };

  const refreshData = async (userInitiated = false) => {
    setLastUpdate(new Date());
    
    if (userInitiated) {
      // Stagger API calls to prevent rate limiting on manual refresh
      fetchBalance(true);
      
      setTimeout(() => {
        fetchPositions(true);
      }, 1000); // 1 second delay
      
      setTimeout(() => {
        fetchHoldings(true);
      }, 2000); // 2 second delay
    } else {
      // Normal throttled refresh
      fetchBalance(false);
      fetchPositions(false);
      fetchHoldings(false);
    }
  };

  useEffect(() => {
    // Staggered initial fetch to prevent rate limiting
    fetchBalance(true); 
    forceMark('balance');
    
    setTimeout(() => {
      fetchPositions(true); 
      forceMark('positions');
    }, 1500); // 1.5 second delay
    
    setTimeout(() => {
      fetchHoldings(true); 
      forceMark('holdings');
    }, 3000); // 3 second delay

    // Listen for position and holdings update events
    const handlePositionUpdate = () => fetchPositions();
    const handleHoldingsUpdate = () => fetchHoldings();
    const handleOrderEvent = () => {
      // Allow balance update and position/holding updates (will be throttled if within cooldown)
      fetchPositions();
      fetchHoldings();
      fetchBalance();
    };

  window.addEventListener('positionUpdate', handlePositionUpdate);
  window.addEventListener('holdingsUpdate', handleHoldingsUpdate);
  window.addEventListener('orderExecuted', handleOrderEvent);
  window.addEventListener('orderPlaced', handleOrderEvent);
    
    return () => {
      window.removeEventListener('positionUpdate', handlePositionUpdate);
      window.removeEventListener('holdingsUpdate', handleHoldingsUpdate);
  window.removeEventListener('orderExecuted', handleOrderEvent);
  window.removeEventListener('orderPlaced', handleOrderEvent);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
        
        <div className="flex items-center mt-4 md:mt-0 space-x-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={() => setShowOrderHistory(true)}
            className="flex items-center text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <History className="h-4 w-4 mr-2" />
            Order History
          </button>
          <button 
            onClick={() => refreshData(true)}
            className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Balance</h3>
            <Wallet className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Available</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{balance.availabelBalance?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Withdrawable</div>
              <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
                ₹{balance.withdrawableBalance?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Portfolio Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Positions:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{positions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Holdings:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{holdings.length}</span>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Total P&L</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Positions P&L:</span>
              <span className={`font-semibold ${
                positions.reduce((total: number, pos: any) => total + (pos.unrealizedProfit || 0), 0) >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                ₹{positions.reduce((total: number, pos: any) => total + (pos.unrealizedProfit || 0), 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Holdings P&L:</span>
              <span className={`font-semibold ${
                holdings.reduce((total: number, holding: any) => {
                  const pnl = (holding.lastTradedPrice - holding.avgCostPrice) * holding.totalQty;
                  return total + pnl;
                }, 0) >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                ₹{holdings.reduce((total: number, holding: any) => {
                  const pnl = (holding.lastTradedPrice - holding.avgCostPrice) * holding.totalQty;
                  return total + pnl;
                }, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Positions and Holdings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Positions */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Positions</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Current trading positions
              </div>
            </div>
            <button 
              onClick={() => fetchPositions(true)}
              className="flex items-center px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
          
          <div className="p-4">
            {positions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                <ShoppingCart className="h-8 w-8 mb-2 opacity-50" />
                <p>No positions available</p>
                <p className="text-sm mt-1">Your trading positions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {positions.map((position: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{position.tradingSymbol}</div>
                      <div className={`text-sm font-medium ${
                        position.positionType === 'LONG' ? 'text-green-600 dark:text-green-400' :
                        position.positionType === 'SHORT' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {position.positionType} • {position.productType}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Qty: {position.netQty}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">₹{position.buyAvg?.toFixed(2) || '0.00'}</div>
                      <div className={`text-sm ${
                        (position.unrealizedProfit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        P&L: ₹{position.unrealizedProfit?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Holdings */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Holdings</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Long-term investments
              </div>
            </div>
            <button 
              onClick={() => fetchHoldings(true)}
              className="flex items-center px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
          
          <div className="p-4">
            {holdings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                <ShoppingCart className="h-8 w-8 mb-2 opacity-50" />
                <p>No holdings available</p>
                <p className="text-sm mt-1">Your investment holdings will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {holdings.map((holding: any, index: number) => {
                  const pnl = (holding.lastTradedPrice - holding.avgCostPrice) * holding.totalQty;
                  const currentValue = holding.lastTradedPrice * holding.totalQty;
                  return (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{holding.tradingSymbol}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{holding.exchange} • Qty: {holding.totalQty}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-white">₹{currentValue?.toFixed(2)}</div>
                        <div className={`text-sm ${pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          P&L: ₹{pnl?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order History Modal */}
      <OrderHistory
        isOpen={showOrderHistory}
        onClose={() => setShowOrderHistory(false)}
      />
    </div>
  );
};

export default Portfolio;