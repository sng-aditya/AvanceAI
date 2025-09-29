import React from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface OrderCardProps {
  stock: string;
  quantity: number;
  type: string;
  product: string;
  status: string;
  reason?: string;
  orderId: string;
  time: string;
  onViewDetails?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  stock,
  quantity,
  type,
  product,
  status,
  reason,
  orderId,
  time,
  onViewDetails
}) => {
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
        return 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-900/20 dark:border-green-800';
      case 'REJECTED':
      case 'CANCELLED':
        return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-900/20 dark:border-red-800';
      case 'PENDING':
      case 'TRANSIT':
        return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-800';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-800/20 dark:border-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'BUY' 
      ? 'text-green-600 bg-green-100 dark:bg-green-900/20' 
      : 'text-red-600 bg-red-100 dark:bg-red-900/20';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="font-bold text-lg text-gray-900 dark:text-white">
            {stock}
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(type)}`}>
            {type}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(status)}
          <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Quantity</span>
          <p className="font-medium text-gray-900 dark:text-white">{quantity}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Product</span>
          <p className="font-medium text-gray-900 dark:text-white">{product}</p>
        </div>
      </div>

      {reason && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <span className="text-sm font-medium text-red-800 dark:text-red-300">Reason: </span>
          <span className="text-sm text-red-700 dark:text-red-400">{reason}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>ID: {orderId}</span>
        <span>{new Date(time).toLocaleString()}</span>
      </div>

      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="mt-3 w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          View Details
        </button>
      )}
    </div>
  );
};

export default OrderCard;