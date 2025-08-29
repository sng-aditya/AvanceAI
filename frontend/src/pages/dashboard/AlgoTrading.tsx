import React, { useState, useEffect } from 'react';
import { Play, Stop, Code, Save, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';

interface Algorithm {
  id: string;
  name: string;
  code: string;
  language: 'python' | 'json';
  isActive: boolean;
  lastRun?: string;
  status: 'idle' | 'running' | 'error' | 'success';
}

const AlgoTrading: React.FC = () => {
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [selectedAlgo, setSelectedAlgo] = useState<Algorithm | null>(null);
  const [code, setCode] = useState('');
  const [algoName, setAlgoName] = useState('');
  const [language, setLanguage] = useState<'python' | 'json'>('python');
  const [isRunning, setIsRunning] = useState(false);

  const defaultPythonCode = `# AI Trading Algorithm
import pandas as pd
import numpy as np

def trading_strategy(market_data):
    """
    Simple moving average crossover strategy
    """
    # Get current price
    current_price = market_data['ltp']
    symbol = market_data['symbol']
    
    # Simple buy/sell logic
    if current_price > market_data.get('sma_20', 0):
        return {
            'action': 'BUY',
            'symbol': symbol,
            'quantity': 1,
            'price': current_price,
            'reason': 'Price above SMA 20'
        }
    elif current_price < market_data.get('sma_50', 0):
        return {
            'action': 'SELL',
            'symbol': symbol,
            'quantity': 1,
            'price': current_price,
            'reason': 'Price below SMA 50'
        }
    
    return None  # No action

# Algorithm will be executed every 30 seconds
`;

  const defaultJsonConfig = `{
  "strategy": "momentum_trading",
  "parameters": {
    "rsi_period": 14,
    "rsi_overbought": 70,
    "rsi_oversold": 30,
    "stop_loss": 0.02,
    "take_profit": 0.05
  },
  "symbols": ["RELIANCE", "TCS", "HDFCBANK"],
  "position_size": 0.1,
  "max_positions": 3,
  "conditions": {
    "buy": {
      "rsi": "< 30",
      "price_change": "> 0.01"
    },
    "sell": {
      "rsi": "> 70",
      "price_change": "< -0.01"
    }
  }
}`;

  useEffect(() => {
    loadAlgorithms();
    setCode(defaultPythonCode);
  }, []);

  const loadAlgorithms = () => {
    const saved = localStorage.getItem('trading_algorithms');
    if (saved) {
      setAlgorithms(JSON.parse(saved));
    }
  };

  const saveAlgorithm = () => {
    if (!algoName.trim() || !code.trim()) return;

    const newAlgo: Algorithm = {
      id: Date.now().toString(),
      name: algoName,
      code,
      language,
      isActive: false,
      status: 'idle'
    };

    const updated = [...algorithms, newAlgo];
    setAlgorithms(updated);
    localStorage.setItem('trading_algorithms', JSON.stringify(updated));
    
    setAlgoName('');
    setCode(language === 'python' ? defaultPythonCode : defaultJsonConfig);
  };

  const runAlgorithm = async (algo: Algorithm) => {
    setIsRunning(true);
    
    try {
      // Simulate algorithm execution
      const response = await fetch('http://localhost:5000/api/algo/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          algorithmId: algo.id,
          code: algo.code,
          language: algo.language
        })
      });

      const result = await response.json();
      
      if (result.success) {
        updateAlgorithmStatus(algo.id, 'success');
      } else {
        updateAlgorithmStatus(algo.id, 'error');
      }
    } catch (error) {
      console.error('Algorithm execution failed:', error);
      updateAlgorithmStatus(algo.id, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const updateAlgorithmStatus = (id: string, status: Algorithm['status']) => {
    const updated = algorithms.map(algo => 
      algo.id === id 
        ? { ...algo, status, lastRun: new Date().toISOString() }
        : algo
    );
    setAlgorithms(updated);
    localStorage.setItem('trading_algorithms', JSON.stringify(updated));
  };

  const toggleAlgorithm = (id: string) => {
    const updated = algorithms.map(algo => 
      algo.id === id ? { ...algo, isActive: !algo.isActive } : algo
    );
    setAlgorithms(updated);
    localStorage.setItem('trading_algorithms', JSON.stringify(updated));
  };

  const deleteAlgorithm = (id: string) => {
    const updated = algorithms.filter(algo => algo.id !== id);
    setAlgorithms(updated);
    localStorage.setItem('trading_algorithms', JSON.stringify(updated));
  };

  const exportAlgorithm = (algo: Algorithm) => {
    const dataStr = JSON.stringify(algo, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${algo.name}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Algorithmic Trading</h1>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            isRunning 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }`}>
            {isRunning ? 'Running' : 'Idle'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Algorithm Editor */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Algorithm Editor</h2>
          
          <div className="space-y-4">
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Algorithm name"
                value={algoName}
                onChange={(e) => setAlgoName(e.target.value)}
                className="input flex-1"
              />
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value as 'python' | 'json');
                  setCode(e.target.value === 'python' ? defaultPythonCode : defaultJsonConfig);
                }}
                className="input w-32"
              >
                <option value="python">Python</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input font-mono text-sm h-96 resize-none"
                placeholder={language === 'python' ? 'Enter your Python trading algorithm...' : 'Enter your JSON configuration...'}
              />
              <div className="absolute top-2 right-2 flex space-x-1">
                <button
                  onClick={() => setCode(language === 'python' ? defaultPythonCode : defaultJsonConfig)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Load template"
                >
                  <Code className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={saveAlgorithm}
                disabled={!algoName.trim() || !code.trim()}
                className="btn-primary flex items-center disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Algorithm
              </button>
            </div>
          </div>
        </div>

        {/* Saved Algorithms */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Saved Algorithms</h2>
          
          <div className="space-y-3">
            {algorithms.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No algorithms saved</p>
                <p className="text-sm mt-1">Create your first trading algorithm</p>
              </div>
            ) : (
              algorithms.map((algo) => (
                <div key={algo.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{algo.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        algo.language === 'python' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {algo.language.toUpperCase()}
                      </span>
                      {algo.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {algo.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleAlgorithm(algo.id)}
                        className={`p-1 rounded ${
                          algo.isActive 
                            ? 'text-red-600 hover:text-red-700' 
                            : 'text-green-600 hover:text-green-700'
                        }`}
                        title={algo.isActive ? 'Stop' : 'Start'}
                      >
                        {algo.isActive ? <Stop className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      
                      <button
                        onClick={() => runAlgorithm(algo)}
                        disabled={isRunning}
                        className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        title="Run once"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => exportAlgorithm(algo)}
                        className="p-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title="Export"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteAlgorithm(algo.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  {algo.lastRun && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Last run: {new Date(algo.lastRun).toLocaleString()}
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto max-h-32">
                      {algo.code.substring(0, 200)}...
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Algorithm Status */}
      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Active Algorithms</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400">Running</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {algorithms.filter(a => a.isActive).length}
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400">Total Saved</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {algorithms.length}
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Last Execution</div>
            <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              {algorithms.find(a => a.lastRun) 
                ? new Date(algorithms.find(a => a.lastRun)!.lastRun!).toLocaleTimeString()
                : 'Never'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlgoTrading;