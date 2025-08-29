import React, { useState } from 'react';
import { BarChart2, PlusCircle, Edit, Trash2, Play, Pause } from 'lucide-react';

const Strategy: React.FC = () => {
  const [strategies, setStrategies] = useState([
    {
      id: 'STR001',
      name: 'Moving Average Crossover',
      description: 'Strategy based on 20 and 50 EMA crossover',
      status: 'Active',
      winRate: 68,
      returnRate: 12.5,
      createdAt: '2023-08-10T14:30:00'
    },
    {
      id: 'STR002',
      name: 'RSI Oversold Bounce',
      description: 'Buy when RSI goes below 30 and then crosses above',
      status: 'Paused',
      winRate: 72,
      returnRate: 15.8,
      createdAt: '2023-08-15T10:20:00'
    },
    {
      id: 'STR003',
      name: 'Bollinger Band Squeeze',
      description: 'Enter on breakout after band contraction',
      status: 'Active',
      winRate: 65,
      returnRate: 10.2,
      createdAt: '2023-08-22T09:45:00'
    },
    {
      id: 'STR004',
      name: 'Volume Breakout',
      description: 'Enter on price breakout with volume confirmation',
      status: 'Testing',
      winRate: 58,
      returnRate: 8.7,
      createdAt: '2023-09-05T11:15:00'
    }
  ]);
  
  // Toggle strategy status
  const toggleStatus = (id: string) => {
    setStrategies(prev => 
      prev.map(strategy => {
        if (strategy.id === id) {
          return {
            ...strategy,
            status: strategy.status === 'Active' ? 'Paused' : 'Active'
          };
        }
        return strategy;
      })
    );
  };
  
  // Delete strategy
  const deleteStrategy = (id: string) => {
    setStrategies(prev => prev.filter(strategy => strategy.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Strategy Builder</h1>
        
        <button className="mt-4 md:mt-0 btn-primary inline-flex">
          <PlusCircle className="h-5 w-5 mr-2" />
          New Strategy
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <BarChart2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Strategies</h3>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {strategies.filter(s => s.status === 'Active').length}
            <span className="text-sm ml-2 font-normal text-gray-500 dark:text-gray-400">of {strategies.length}</span>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Average Win Rate</h3>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {strategies.length > 0 
              ? (strategies.reduce((sum, s) => sum + s.winRate, 0) / strategies.length).toFixed(1) 
              : 0}%
          </div>
          <div className="mt-2 h-2 bg-gray-200 dark:bg-dark-300 rounded-full overflow-hidden">
            <div 
              className="h-full bg-success-500 rounded-full" 
              style={{ 
                width: `${strategies.length > 0 
                  ? (strategies.reduce((sum, s) => sum + s.winRate, 0) / strategies.length) 
                  : 0}%` 
              }}
            ></div>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Average Return</h3>
          <div className="text-3xl font-bold text-success-600 dark:text-success-400">
            {strategies.length > 0 
              ? (strategies.reduce((sum, s) => sum + s.returnRate, 0) / strategies.length).toFixed(1) 
              : 0}%
          </div>
          <div className="mt-2 h-2 bg-gray-200 dark:bg-dark-300 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 rounded-full" 
              style={{ 
                width: `${strategies.length > 0 
                  ? Math.min(100, (strategies.reduce((sum, s) => sum + s.returnRate, 0) / strategies.length) * 5) 
                  : 0}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-head-cell">Strategy ID</th>
                <th className="table-head-cell">Name</th>
                <th className="table-head-cell">Description</th>
                <th className="table-head-cell">Status</th>
                <th className="table-head-cell text-right">Win Rate</th>
                <th className="table-head-cell text-right">Return Rate</th>
                <th className="table-head-cell">Created</th>
                <th className="table-head-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {strategies.map((strategy) => (
                <tr key={strategy.id} className="table-row">
                  <td className="table-cell font-medium">{strategy.id}</td>
                  <td className="table-cell font-semibold">{strategy.name}</td>
                  <td className="table-cell text-sm">{strategy.description}</td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      strategy.status === 'Active' 
                        ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                        : strategy.status === 'Paused'
                          ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400'
                          : 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                    }`}>
                      {strategy.status}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end">
                      <span className="mr-2">{strategy.winRate}%</span>
                      <div className="w-16 h-2 bg-gray-200 dark:bg-dark-300 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            strategy.winRate > 66 
                              ? 'bg-success-500' 
                              : strategy.winRate > 50 
                                ? 'bg-warning-500' 
                                : 'bg-error-500'
                          }`} 
                          style={{ width: `${strategy.winRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <span className={`font-medium ${
                      strategy.returnRate > 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
                    }`}>
                      {strategy.returnRate > 0 ? '+' : ''}{strategy.returnRate}%
                    </span>
                  </td>
                  <td className="table-cell text-sm">
                    {new Date(strategy.createdAt).toLocaleDateString()}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => toggleStatus(strategy.id)}
                        className="text-gray-500 dark:text-gray-400 hover:text-warning-600 dark:hover:text-warning-400"
                      >
                        {strategy.status === 'Active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                      <button 
                        onClick={() => deleteStrategy(strategy.id)}
                        className="text-gray-500 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {strategies.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No strategies found
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

export default Strategy;