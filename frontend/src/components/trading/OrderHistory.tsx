import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Eye, ArrowLeft } from 'lucide-react';
import { authenticatedFetch } from '../../utils/api';

interface Order {
  id: number;
  orderId: string;
  symbol: string;
  quantity: number;
  orderType: string;
  price: number;
  status: string;
  timestamp: string;
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

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/market/orders');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrders(data.data);
        }
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
        return 'text-amber-700 bg-amber-50/80 dark:text-amber-300 dark:bg-amber-900/30';
      default:
        return 'text-gray-700 bg-gray-50/80 dark:text-gray-300 dark:bg-gray-800/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const viewOrderDetails = async (order: Order) => {
    try {
      const response = await authenticatedFetch(`/market/orders/${order.orderId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedOrder(data.data);
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
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-6 w-6" />
              </button>
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
                <div className="overflow-auto h-full">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Symbol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {orders.map((order) => (
                        <tr key={order.orderId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {order.symbol}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              order.orderType === 'BUY' 
                                ? 'text-green-700 bg-green-50/80 dark:text-green-300 dark:bg-green-900/30' 
                                : 'text-red-700 bg-red-50/80 dark:text-red-300 dark:bg-red-900/30'
                            }`}>
                              {order.orderType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                            {order.executedQuantity ? `${order.executedQuantity}/${order.quantity}` : order.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                            ₹{order.executedPrice ? order.executedPrice.toFixed(2) : (order.price?.toFixed(2) || 'Market')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(order.status)}
                              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(order.updatedAt || order.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => viewOrderDetails(order)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
