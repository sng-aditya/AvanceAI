import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { authenticatedFetch, syncOrders } from '../../utils/api';
import OrderCard from './OrderCard';

interface Order {
  id: number;
  orderId: string;
  symbol: string;
  quantity: number;
  orderType: string;
  price: number;
  status: string;
  timestamp: string;
  priceType?: string;
  exchangeSegment?: string;
  productType?: string;
  executedQuantity?: number;
  executedPrice?: number;
  rejectionReason?: string;
  errorCode?: string;
  errorDetails?: string;
  failureAnalysis?: {
    category: string;
    explanation: string;
    solution: string;
  };
  updatedAt?: string;
  tradingSymbol?: string;
  transactionType?: string;
}

interface OrderHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [polling, setPolling] = useState(false);
  const POLL_INTERVAL = 4000;

  useEffect(() => {
    if (isOpen) {
      (async () => {
        try { await syncOrders(); } catch (_) {}
        fetchOrders();
      })();
    }
  }, [isOpen]);

  // Poll for status updates if there are pending orders
  useEffect(() => {
    if (!isOpen) return;
    const hasPending = orders.some(o => ['PENDING','TRANSIT'].includes(o.status?.toUpperCase()));
    if (!hasPending) return;
    if (polling) return;
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        await syncOrders();
        await fetchOrders();
      } catch (_) {}
    }, POLL_INTERVAL);
    return () => { clearInterval(interval); setPolling(false); };
  }, [isOpen, orders, polling]);

  // Listen for order events to refresh automatically if modal open
  useEffect(() => {
    const handler = () => {
      if (isOpen) fetchOrders();
    };
    window.addEventListener('orderExecuted', handler);
    window.addEventListener('orderPlaced', handler);
    return () => {
      window.removeEventListener('orderExecuted', handler);
      window.removeEventListener('orderPlaced', handler);
    };
  }, [isOpen]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/orders/history');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrders(data.data || []);
        } else {
          console.warn('Order history fetch success=false structure unexpected');
        }
      } else {
        console.warn('Order history HTTP not ok');
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'EXECUTED':
      case 'COMPLETE':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'PENDING':
      case 'TRANSIT':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'EXECUTED':
      case 'COMPLETE':
        return 'text-green-700 bg-green-50/80 dark:text-green-300 dark:bg-green-900/30';
      case 'REJECTED':
      case 'CANCELLED':
        return 'text-red-700 bg-red-50/80 dark:text-red-300 dark:bg-red-900/30';
      case 'PENDING':
      case 'TRANSIT':
        return 'text-amber-700 bg-amber-50/80 dark:text-amber-300 dark:bg-amber-900/30';
      default:
        return 'text-gray-700 bg-gray-50/80 dark:text-gray-300 dark:bg-gray-800/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatRejectionReason = (order: Order) => {
    if (!order.rejectionReason) return undefined;
    
    const reason = order.rejectionReason;
    
    // Parse insufficient funds error
    const fundsMatch = reason.match(/required margin is ([\d.]+) and available margin ([\d.]+)/);
    if (fundsMatch) {
      return `Insufficient Funds (Required ₹${fundsMatch[1]}, Available ₹${fundsMatch[2]})`;
    }
    
    // Return original reason if no specific pattern matches
    return reason;
  };

  const viewOrderDetails = async (order: Order) => {
    try {
      const response = await authenticatedFetch(`/orders/${order.orderId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedOrder({
            ...order,
            ...data.data,
            status: (data.data.status || data.data.orderStatus || order.status || 'PENDING').toUpperCase(),
            executedQuantity: data.data.executedQuantity ?? data.data.filledQty ?? order.executedQuantity,
            executedPrice: data.data.executedPrice ?? data.data.averageTradedPrice ?? order.executedPrice,
            rejectionReason: data.data.rejectionReason || data.data.reason || data.data.omsErrorDescription || order.rejectionReason,
            errorCode: data.data.errorCode || data.data.omsErrorCode || order.errorCode,
            priceType: data.data.priceType || data.data.orderType || order.priceType,
            exchangeSegment: data.data.exchangeSegment || order.exchangeSegment,
            productType: data.data.productType || order.productType,
            updatedAt: data.data.updateTime || data.data.updatedAt || order.updatedAt
          });
          setShowDetails(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      setSelectedOrder(order);
      setShowDetails(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl mx-4 h-[80vh] flex flex-col">
        {!showDetails ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Order History
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchOrders}
                  disabled={loading}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No orders found</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-auto h-full p-4">
                  <div className="grid gap-4">
                    {orders.map((order) => (
                      <OrderCard
                        key={order.orderId}
                        stock={order.tradingSymbol || order.symbol}
                        quantity={order.quantity}
                        type={order.transactionType || order.orderType}
                        product={order.productType || 'INTRADAY'}
                        status={order.status}
                        reason={formatRejectionReason(order)}
                        orderId={order.orderId}
                        time={order.updatedAt || order.timestamp}
                        onViewDetails={() => viewOrderDetails(order)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Order Details View */
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mr-4"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Order Details
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {selectedOrder && (
                <div className="space-y-6">
                  {/* Order Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Order Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Order ID</label>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.orderId}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Symbol</label>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.symbol}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Product Type</label>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.productType || '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Exchange Segment</label>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.exchangeSegment || '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Order Type</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          selectedOrder.orderType === 'BUY' 
                            ? 'text-green-600 bg-green-100 dark:bg-green-900/20' 
                            : 'text-red-600 bg-red-100 dark:bg-red-900/20'
                        }`}>
                          {selectedOrder.orderType}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
                        <div className="flex items-center">
                          {getStatusIcon(selectedOrder.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}>
                            {selectedOrder.status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Executed Qty</label>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.executedQuantity ?? 0}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Executed Price</label>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.executedPrice ? `₹${selectedOrder.executedPrice.toFixed(2)}` : '—'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Price Type</label>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.priceType || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Execution Details */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Execution Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Requested Quantity</label>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.quantity}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Executed Quantity</label>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedOrder.executedQuantity || 0}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Requested Price</label>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedOrder.price ? `₹${selectedOrder.price.toFixed(2)}` : 'Market Price'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Executed Price</label>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedOrder.executedPrice ? `₹${selectedOrder.executedPrice.toFixed(2)}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Timeline
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Order Placed:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(selectedOrder.timestamp)}
                        </span>
                      </div>
                      {selectedOrder.updatedAt && selectedOrder.updatedAt !== selectedOrder.timestamp && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Last Updated:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(selectedOrder.updatedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Failure Analysis */}
                  {(selectedOrder.rejectionReason || selectedOrder.failureAnalysis) && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-4">
                        Order Failure Details
                      </h3>
                      
                      {selectedOrder.failureAnalysis && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
                              Category: {selectedOrder.failureAnalysis.category}
                            </h4>
                            <p className="text-red-600 dark:text-red-400 mb-3">
                              {selectedOrder.failureAnalysis.explanation}
                            </p>
                            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded">
                              <h5 className="font-medium text-red-800 dark:text-red-300 mb-1">Solution:</h5>
                              <p className="text-red-700 dark:text-red-400 text-sm">
                                {selectedOrder.failureAnalysis.solution}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {selectedOrder.rejectionReason && (
                        <div className="mt-4">
                          <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
                            Raw Error Message:
                          </h4>
                          <p className="text-red-600 dark:text-red-400 text-sm font-mono bg-red-100 dark:bg-red-900/30 p-2 rounded">
                            {selectedOrder.rejectionReason}
                          </p>
                        </div>
                      )}
                      
                      {selectedOrder.errorCode && (
                        <div className="mt-4">
                          <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
                            Error Code:
                          </h4>
                          <p className="text-red-600 dark:text-red-400 text-sm font-mono">
                            {selectedOrder.errorCode}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
