import React, { useState } from 'react';
import { RefreshCw, Filter, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Orders: React.FC = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [orders, setOrders] = useState([
    {
      id: 'ORD12345',
      symbol: 'RELIANCE',
      side: 'Buy',
      type: 'Limit',
      quantity: 10,
      price: 2785.50,
      status: 'Executed',
      strategy: 'MA Crossover',
      placedAt: '2023-09-15T09:30:00',
      executedAt: '2023-09-15T09:30:05'
    },
    {
      id: 'ORD12346',
      symbol: 'INFY',
      side: 'Sell',
      type: 'Limit',
      quantity: 20,
      price: 1450.75,
      status: 'Executed',
      strategy: 'RSI Divergence',
      placedAt: '2023-09-15T10:15:00',
      executedAt: '2023-09-15T10:15:08'
    },
    {
      id: 'ORD12347',
      symbol: 'HDFCBANK',
      side: 'Buy',
      type: 'Limit',
      quantity: 5,
      price: 1685.25,
      status: 'Rejected',
      strategy: 'Bollinger Breakout',
      placedAt: '2023-09-15T11:00:00',
      executedAt: null
    },
    {
      id: 'ORD12348',
      symbol: 'TCS',
      side: 'Buy',
      type: 'Market',
      quantity: 3,
      price: null,
      status: 'Pending',
      strategy: 'Momentum Scalping',
      placedAt: '2023-09-15T15:30:00',
      executedAt: null
    }
  ]);
  
  // Available statuses for filtering
  const statuses = ['All', 'Pending', 'Executed', 'Rejected', 'Cancelled'];

  // Handle refresh
  const refreshData = () => {
    setLastUpdate(new Date());
    
    // Simulate status updates for pending orders
    setOrders(prev => 
      prev.map(order => {
        if (order.status === 'Pending') {
          const randomStatus = Math.random();
          if (randomStatus > 0.7) {
            return {
              ...order,
              status: 'Executed',
              executedAt: new Date().toISOString()
            };
          } else if (randomStatus > 0.4) {
            return {
              ...order,
              status: 'Rejected'
            };
          }
        }
        return order;
      })
    );
  };

  // Filter orders based on selected status
  const filteredOrders = orders.filter(order => {
    return selectedStatus === 'All' || order.status === selectedStatus;
  });

  // Order counts by status
  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const executedCount = orders.filter(o => o.status === 'Executed').length;
  const rejectedCount = orders.filter(o => o.status === 'Rejected' || o.status === 'Cancelled').length;

  // Status indicator
  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'Executed':
        return <CheckCircle className="h-4 w-4 text-success-500 dark:text-success-400" />;
      case 'Rejected':
      case 'Cancelled':
        return <XCircle className="h-4 w-4 text-error-500 dark:text-error-400" />;
      case 'Pending':
        return <Clock className="h-4 w-4 text-warning-500 dark:text-warning-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
        
        <div className="flex items-center mt-4 md:mt-0 space-x-4">
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
      
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1 md:max-w-xs">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <div className="relative">
            <select
              id="status-filter"
              className="input"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center space-x-3">
          <div className="p-2 rounded-full bg-warning-100 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</div>
            <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{pendingCount}</div>
          </div>
        </div>
        
        <div className="card p-4 flex items-center space-x-3">
          <div className="p-2 rounded-full bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Executed</div>
            <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{executedCount}</div>
          </div>
        </div>
        
        <div className="card p-4 flex items-center space-x-3">
          <div className="p-2 rounded-full bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Rejected/Cancelled</div>
            <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{rejectedCount}</div>
          </div>
        </div>
      </div>
      
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-head-cell">Order ID</th>
                <th className="table-head-cell">Symbol</th>
                <th className="table-head-cell">Side</th>
                <th className="table-head-cell">Type</th>
                <th className="table-head-cell text-right">Quantity</th>
                <th className="table-head-cell text-right">Price</th>
                <th className="table-head-cell">Status</th>
                <th className="table-head-cell">Strategy</th>
                <th className="table-head-cell">Placed At</th>
                <th className="table-head-cell">Executed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="table-row">
                  <td className="table-cell font-medium">{order.id}</td>
                  <td className="table-cell">{order.symbol}</td>
                  <td className={`table-cell ${
                    order.side === 'Buy' ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
                  }`}>
                    {order.side}
                  </td>
                  <td className="table-cell">{order.type}</td>
                  <td className="table-cell text-right">{order.quantity}</td>
                  <td className="table-cell text-right">{order.price ? `₹${order.price.toFixed(2)}` : 'Market'}</td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      {getStatusIndicator(order.status)}
                      <span className="ml-2">{order.status}</span>
                    </div>
                  </td>
                  <td className="table-cell">{order.strategy}</td>
                  <td className="table-cell">
                    {new Date(order.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="table-cell">
                    {order.executedAt 
                      ? new Date(order.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : '-'
                    }
                  </td>
                </tr>
              ))}
              
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;