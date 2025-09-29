import React, { useState } from 'react';
import { X, TrendingUp, AlertCircle } from 'lucide-react';

interface StockTradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowOrderHistory?: () => void;
  stock: {
    symbol: string;
    ltp: number;
    change: number;
    changePercent: number;
    isPositive: boolean;
  } | null;
  onOrderPlace: (orderData: {
    symbol: string;
    quantity: number;
    orderType: 'BUY' | 'SELL';
    priceType: 'MARKET' | 'LIMIT';
    limitPrice?: number;
    exchangeSegment?: string;
    productType?: string;
    validity?: string;
  }) => void;
}

const StockTradingModal: React.FC<StockTradingModalProps> = ({
  isOpen,
  onClose,
  onShowOrderHistory,
  stock,
  onOrderPlace
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [priceType, setPriceType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<number>(stock?.ltp || 0);
  const [exchangeSegment, setExchangeSegment] = useState<string>('NSE_EQ');
  const [productType, setProductType] = useState<string>('INTRADAY');
  const [validity, setValidity] = useState<string>('DAY');
  const [mode, setMode] = useState<'form' | 'confirm' | 'success'>('form');
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  if (!isOpen || !stock) return null;

  const totalValue = quantity * (priceType === 'MARKET' ? stock.ltp : limitPrice);

  const handlePlaceOrder = () => setMode('confirm');

  const confirmOrder = async () => {
    setPlacing(true);
    try {
      const orderPayload = {
        symbol: stock.symbol,
        quantity,
        orderType,
        priceType,
        limitPrice: priceType === 'LIMIT' ? limitPrice : undefined,
        exchangeSegment,
        productType,
        validity
      };
      // onOrderPlace may be async; capture result if it returns one
      const maybeResult: any = await onOrderPlace(orderPayload as any);
      const newId = maybeResult?.data?.orderId || maybeResult?.orderId || null;
      setPlacedOrderId(newId);
      setMode('success');
    } catch (e) {
      console.error('Order placement failed in modal:', e);
      setMode('form');
    } finally {
      setPlacing(false);
    }
  };

  const cancelOrder = () => setMode('form');

  const resetAndClose = () => {
    setMode('form');
    setPlacedOrderId(null);
    setQuantity(1);
    setPriceType('MARKET');
    setLimitPrice(stock.ltp);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        {mode === 'form' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Trade {stock.symbol}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Stock Info */}
            <div className="bg-gray-50/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg p-4 mb-6 border border-gray-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {stock.symbol}
                  </h3>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{stock.ltp.toFixed(2)}
                  </div>
                </div>
                <div className={`flex items-center ${stock.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className={`h-4 w-4 mr-1 ${!stock.isPositive ? 'rotate-180' : ''}`} />
                  <span className="font-medium">
                    {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Order Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order Type
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setOrderType('BUY')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                    orderType === 'BUY'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  BUY
                </button>
                <button
                  onClick={() => setOrderType('SELL')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                    orderType === 'SELL'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Price Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Type
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPriceType('MARKET')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                    priceType === 'MARKET'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  MARKET
                </button>
                <button
                  onClick={() => setPriceType('LIMIT')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                    priceType === 'LIMIT'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  LIMIT
                </button>
              </div>
            </div>

            {/* Limit Price */}
            {priceType === 'LIMIT' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Limit Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            {/* Product Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Type
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="INTRADAY">Intraday</option>
                <option value="CNC">CNC (Cash & Carry)</option>
              </select>
            </div>

            {/* Exchange Segment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exchange
              </label>
              <select
                value={exchangeSegment}
                onChange={(e) => setExchangeSegment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="NSE_EQ">NSE Equity</option>
                <option value="BSE_EQ">BSE Equity</option>
              </select>
            </div>

            {/* Validity */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Validity
              </label>
              <select
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="DAY">Day</option>
                <option value="IOC">IOC (Immediate or Cancel)</option>
              </select>
            </div>

            {/* Total Value */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Value:
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  ₹{totalValue.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
                orderType === 'BUY'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } transition-colors`}
            >
              Place {orderType} Order
            </button>
          </>
        )}
        {mode === 'confirm' && (
          <>
            <div className="text-center mb-6">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Confirm Order
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please review your order details before confirming
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Symbol:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stock.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className={`font-medium ${orderType === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                    {orderType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Price:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {priceType === 'MARKET' ? 'Market Price' : `₹${limitPrice.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Product:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{productType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Exchange:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{exchangeSegment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Validity:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{validity}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 dark:text-gray-400">Total:</span>
                  <span className="font-bold text-gray-900 dark:text-white">₹{totalValue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelOrder}
                disabled={placing}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={confirmOrder}
                disabled={placing}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-white ${
                  orderType === 'BUY'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } transition-colors disabled:opacity-50`}
              >
                {placing ? 'Placing...' : 'Confirm Order'}
              </button>
            </div>
          </>
        )}
        {mode === 'success' && (
          <>
            <div className="text-center mb-6">
              <div className="h-14 w-14 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Order Placed</h2>
              <p className="text-gray-600 dark:text-gray-400">Your {orderType} order for <span className="font-semibold">{stock.symbol}</span> has been submitted.</p>
              {placedOrderId && (
                <p className="text-xs mt-2 text-gray-500 dark:text-gray-500">Order ID: {placedOrderId}</p>
              )}
            </div>
            <div className="space-y-3">
              <button
                onClick={() => { onShowOrderHistory?.(); resetAndClose(); }}
                className="w-full py-2 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                View Order History
              </button>
              <button
                onClick={resetAndClose}
                className="w-full py-2 px-4 rounded-lg font-medium bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StockTradingModal;
