import React, { useState, useEffect } from 'react';
import { RefreshCw, Wallet, X, History, ShoppingCart } from 'lucide-react';
import MarketData from '../../components/dashboard/MarketData';
import StockTradingModal from '../../components/trading/StockTradingModal';
import OrderHistory from '../../components/trading/OrderHistory';

interface WatchlistItem {
  id: number;
  symbol: string;
  ltp?: number;
  change?: number;
  changePercent?: number;
  isPositive?: boolean;
}

interface BalanceData {
  availabelBalance: number;
  withdrawableBalance: number;
}

const Dashboard: React.FC = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [balance, setBalance] = useState<BalanceData>({ availabelBalance: 0, withdrawableBalance: 0 });
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [selectedStock, setSelectedStock] = useState<WatchlistItem | null>(null);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  
  const fetchBalance = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/market/balance', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setBalance(data.data);
      }
    } catch (error) {
      console.warn('Failed to fetch balance, keeping existing data:', error);
      // Keep existing balance data instead of resetting to 0
    }
  };

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/watchlist', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) setWatchlist(data.data);
    } catch (error) {
      console.warn('Failed to fetch watchlist, keeping existing data:', error);
      // Keep existing watchlist data
    }
  };

  const addToWatchlist = async (symbol: string) => {
    if (!symbol.trim()) return;
    try {
      const response = await fetch('http://localhost:5000/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ symbol: symbol.toUpperCase() })
      });
      const data = await response.json();
      if (data.success) {
        fetchWatchlist();
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    try {
      await fetch(`http://localhost:5000/api/watchlist/${symbol}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchWatchlist();
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  };

  const handleStockClick = (stock: WatchlistItem) => {
    setSelectedStock(stock);
    setShowTradingModal(true);
  };

  const handleOrderPlace = async (orderData: {
    symbol: string;
    quantity: number;
    orderType: 'BUY' | 'SELL';
    price?: number;
  }) => {
    try {
      const response = await fetch('http://localhost:5000/api/market/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Order submitted successfully!\nOrder ID: ${data.data?.orderId || 'N/A'}\nStatus: ${data.data?.status || 'Submitted'}`);
        fetchBalance();
      } else {
        const errorMsg = data.errorDetails ? 
          `❌ Order rejected: ${data.message}\n\nDetails: ${data.errorDetails.message || data.message}` :
          `❌ Order rejected: ${data.message || 'Unknown error'}`;
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      alert(`❌ Network error: ${error.message || 'Unable to connect to server'}`);
    }
  };

  const refreshData = () => {
    setLastUpdate(new Date());
    fetchBalance();
    fetchWatchlist();
  };
  
  useEffect(() => {
    fetchBalance();
    fetchWatchlist();
    const intervalId = setInterval(refreshData, 10000); // 10 seconds
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="space-y-8">
      {/* Live Market Data Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <MarketData refreshInterval={30000} onStockClick={handleStockClick} addToWatchlist={addToWatchlist} />
      </div>
      
      {/* Account Balance Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trading Dashboard</h1>
          
          <div className="flex items-center mt-4 md:mt-0 space-x-4">
            <button
              onClick={() => setShowOrderHistory(true)}
              className="flex items-center text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <History className="h-4 w-4 mr-1" />
              Order History
            </button>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
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
        
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Watchlist Items</h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {watchlist.length}
            </span>
            <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              stocks tracked
            </span>
          </div>
        </div>
      </div>
      
      {/* Watchlist Section */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">My Watchlist</h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Click on any stock to trade
          </div>
        </div>
        
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-head-cell">Symbol</th>
                <th className="table-head-cell text-right">LTP</th>
                <th className="table-head-cell text-right">Change</th>
                <th className="table-head-cell text-right">Change %</th>
                <th className="table-head-cell text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {watchlist.map((item) => (
                <tr key={item.id} className="table-row hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <td 
                    className="table-cell font-medium"
                    onClick={() => handleStockClick(item)}
                  >
                    <div className="flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="font-semibold">{item.symbol}</span>
                    </div>
                  </td>
                  <td 
                    className="table-cell text-right font-medium"
                    onClick={() => handleStockClick(item)}
                  >
                    {item.ltp ? `₹${item.ltp.toFixed(2)}` : 'N/A'}
                  </td>
                  <td 
                    className={`table-cell text-right font-medium ${item.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    onClick={() => handleStockClick(item)}
                  >
                    {item.change !== undefined && item.change !== null ? (item.isPositive ? '+' : '') + item.change.toFixed(2) : 'N/A'}
                  </td>
                  <td 
                    className={`table-cell text-right font-medium ${item.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                    onClick={() => handleStockClick(item)}
                  >
                    {item.changePercent !== undefined && item.changePercent !== null ? (item.isPositive ? '+' : '') + item.changePercent.toFixed(2) + '%' : 'N/A'}
                  </td>
                  <td className="table-cell text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWatchlist(item.symbol);
                      }}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {watchlist.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center">
                      <ShoppingCart className="h-8 w-8 mb-2 opacity-50" />
                      <p>No stocks in watchlist</p>
                      <p className="text-sm mt-1">Click on any stock from market data to add</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Trading Modal */}
      <StockTradingModal
        isOpen={showTradingModal}
        onClose={() => setShowTradingModal(false)}
        stock={selectedStock ? {
          symbol: selectedStock.symbol,
          ltp: selectedStock.ltp || 0,
          change: selectedStock.change || 0,
          changePercent: selectedStock.changePercent || 0,
          isPositive: selectedStock.isPositive || false
        } : null}
        onOrderPlace={handleOrderPlace}
      />

      {/* Order History Modal */}
      <OrderHistory
        isOpen={showOrderHistory}
        onClose={() => setShowOrderHistory(false)}
      />
    </div>
  );
};

export default Dashboard;