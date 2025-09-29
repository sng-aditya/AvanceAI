import React, { useState } from 'react';
// Removed unused icon imports after refactor
import MarketData from '../../components/dashboard/MarketData';
import StockTradingModal from '../../components/trading/StockTradingModal';
import OrderHistory from '../../components/trading/OrderHistory';
import { placeOrder, OrderData, addWatchlistSymbol } from '../../utils/api';

interface MarketItem {
  symbol: string;
  name?: string;
  ltp: number;
  change?: number;
  changePercent?: number;
  isPositive?: boolean;
}

const Dashboard: React.FC = () => {
  // State only for modal visibility and selected stock
  const [selectedStock, setSelectedStock] = useState<MarketItem | null>(null);
  const [showTradingModal, setShowTradingModal] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  const handleStockClick = (stock: MarketItem) => {
    setSelectedStock(stock);
    setShowTradingModal(true);
  };

  const addToWatchlist = async (symbol: string) => {
    try {
      const result = await addWatchlistSymbol(symbol);
      if (result.success) {
        console.log('Added to watchlist:', symbol);
        window.dispatchEvent(new CustomEvent('watchlistUpdated'));
      } else {
        console.warn('Watchlist add failed:', result.message || result.error);
      }
    } catch (err) {
      console.error('Watchlist add error:', err);
    }
  };

  const handleOrderPlace = async (orderData: OrderData) => {
    try {
      const result = await placeOrder(orderData);
      if (!result.success) {
        console.error('Order placement failed:', result.error);
      }
      return result; // allow modal to capture orderId
    } catch (error) {
      console.error('Order placement error:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      {/* Live Market Data Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <MarketData refreshInterval={1000} onStockClick={handleStockClick} addToWatchlist={addToWatchlist} />
      </div>
      


      {/* Stock Trading Modal */}
      <StockTradingModal
        isOpen={showTradingModal}
        onClose={() => setShowTradingModal(false)}
        onShowOrderHistory={() => setShowOrderHistory(true)}
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
