import React, { useState } from 'react';
import { RefreshCw, PlusCircle, List, Grid, Trash2 } from 'lucide-react';

const BasketOrders: React.FC = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [baskets, setBaskets] = useState([
    {
      id: 'BKT001',
      name: 'Morning Gap Up Basket',
      description: 'Buy basket for stocks with gap up opening',
      orders: 5,
      status: 'Ready',
      createdAt: '2023-09-15T08:30:00'
    },
    {
      id: 'BKT002',
      name: 'Index Options Hedge',
      description: 'Hedging positions with index options',
      orders: 3,
      status: 'Executed',
      createdAt: '2023-09-14T15:45:00'
    },
    {
      id: 'BKT003',
      name: 'Sector Rotation',
      description: 'Basket for sector rotation strategy',
      orders: 8,
      status: 'Ready',
      createdAt: '2023-09-13T11:20:00'
    },
    {
      id: 'BKT004',
      name: 'End of Day Exit',
      description: 'Exit all intraday positions',
      orders: 6,
      status: 'Draft',
      createdAt: '2023-09-15T14:15:00'
    }
  ]);
  
  // Handle refresh
  const refreshData = () => {
    setLastUpdate(new Date());
  };

  // Delete basket
  const deleteBasket = (id: string) => {
    setBaskets(prev => prev.filter(basket => basket.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Basket Orders</h1>
        
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
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <button className="btn-primary inline-flex">
          <PlusCircle className="h-5 w-5 mr-2" />
          Create New Basket
        </button>
        
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-dark-300 rounded-md p-1">
          <button 
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-dark-100 shadow' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setViewMode('list')}
          >
            <List className="h-5 w-5" />
          </button>
          <button 
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-dark-100 shadow' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {viewMode === 'list' ? (
        <div className="card overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-head-cell">Basket ID</th>
                  <th className="table-head-cell">Name</th>
                  <th className="table-head-cell">Description</th>
                  <th className="table-head-cell text-right">Orders</th>
                  <th className="table-head-cell">Status</th>
                  <th className="table-head-cell">Created At</th>
                  <th className="table-head-cell text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {baskets.map((basket) => (
                  <tr key={basket.id} className="table-row">
                    <td className="table-cell font-medium">{basket.id}</td>
                    <td className="table-cell font-medium">{basket.name}</td>
                    <td className="table-cell">{basket.description}</td>
                    <td className="table-cell text-right">{basket.orders}</td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        basket.status === 'Ready' 
                          ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                          : basket.status === 'Executed'
                            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                            : 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400'
                      }`}>
                        {basket.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      {new Date(basket.createdAt).toLocaleDateString()} {new Date(basket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="table-cell text-right">
                      <button 
                        onClick={() => deleteBasket(basket.id)}
                        className="text-gray-500 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                
                {baskets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No basket orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {baskets.map((basket) => (
            <div key={basket.id} className="card hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{basket.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{basket.id}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    basket.status === 'Ready' 
                      ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                      : basket.status === 'Executed'
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400'
                  }`}>
                    {basket.status}
                  </span>
                </div>
                
                <p className="mt-4 text-gray-600 dark:text-gray-300">{basket.description}</p>
                
                <div className="mt-4 flex justify-between items-center text-sm">
                  <div className="text-gray-500 dark:text-gray-400">
                    {basket.orders} orders
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {new Date(basket.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium">
                    View Details
                  </button>
                  <button 
                    onClick={() => deleteBasket(basket.id)}
                    className="text-gray-500 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {baskets.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No basket orders found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BasketOrders;