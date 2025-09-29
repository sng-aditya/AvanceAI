import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { authenticatedFetch } from '../../utils/api';
import OrderCard from '../../components/trading/OrderCard';

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
  tradingSymbol?: string;
  productType?: string;
  transactionType?: string;
}

const OrdersHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/orders/history');
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Order History
        </h1>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Content */}
      <div className="card p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No orders found</p>
            </div>
          </div>
        ) : (
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
                onViewDetails={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersHistory;