import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, ExternalLink } from 'lucide-react';
import { authenticatedFetch } from '../../utils/api';

// Declare TradingView global
declare global {
  interface Window {
    TradingView: any;
  }
}

interface StockData {
  symbol: string;
  ltp: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

// Symbol mapping for TradingView - moved outside component for performance
const SYMBOL_MAP: { [key: string]: string } = {
  // Indices
  'NIFTY_50': 'NSE:NIFTY',
  'BANK_NIFTY': 'NSE:BANKNIFTY',
  'SENSEX': 'BSE:SENSEX',
  
  // Stocks - NSE by default
  'RELIANCE': 'NSE:RELIANCE',
  'TCS': 'NSE:TCS',
  'HDFCBANK': 'NSE:HDFCBANK',
  'INFY': 'NSE:INFY',
  'WIPRO': 'NSE:WIPRO',
  'ICICIBANK': 'NSE:ICICIBANK',
  'SBIN': 'NSE:SBIN',
  'BHARTIARTL': 'NSE:BHARTIARTL'
};

const getTradingViewSymbol = (symbol: string) => {
  return SYMBOL_MAP[symbol.toUpperCase()] || `NSE:${symbol.toUpperCase()}`;
};

const Charts: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');
  const [marketData, setMarketData] = useState<StockData[]>([]);

  const fetchMarketData = async () => {
    try {
      const response = await authenticatedFetch('/market/summary');
      const result = await response.json();
      if (result.success) {
        setMarketData(result.data.topStocks || []);
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  const clearContainer = () => {
    const container = document.getElementById('tradingview_chart');
    if (container) container.innerHTML = '';
  };

  const showError = () => {
    const container = document.getElementById('tradingview_chart');
    if (container) {
      container.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Failed to load chart. Please refresh the page.</div>';
    }
  };

  const createWidget = (symbol: string) => {
    if (!window.TradingView) return;
    
    try {
      new window.TradingView.widget({
        container_id: "tradingview_chart",
        symbol,
        interval: "D",
        timezone: "Asia/Kolkata",
        theme: "light",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        save_image: false,
        studies: [],
        autosize: true,
        width: "100%",
        height: 600
      });
    } catch (error) {
      console.error('Failed to create TradingView widget:', error);
      showError();
    }
  };

  const loadScript = (onSuccess: () => void) => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = onSuccess;
    script.onerror = () => {
      console.error('Failed to load TradingView script');
      showError();
    };
    document.head.appendChild(script);
  };

  const loadTradingViewWidget = (symbol: string) => {
    const tradingViewSymbol = getTradingViewSymbol(symbol);
    clearContainer();
    
    const initWidget = () => setTimeout(() => createWidget(tradingViewSymbol), 100);
    
    if (!window.TradingView) {
      loadScript(initWidget);
    } else {
      initWidget();
    }
  };

  // Get symbol from URL params if available
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const symbolParam = urlParams.get('symbol');
    if (symbolParam) {
      setSelectedSymbol(symbolParam);
    }
  }, []);

  // Load widget when symbol changes
  useEffect(() => {
    loadTradingViewWidget(selectedSymbol);
  }, [selectedSymbol]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="h-6 w-6 mr-2" />
          Market Charts
        </h1>
        
        <select
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="input w-48"
        >
          <option value="NIFTY_50">NIFTY 50</option>
          <option value="BANK_NIFTY">BANK NIFTY</option>
          <option value="SENSEX">SENSEX</option>
          <option value="RELIANCE">RELIANCE</option>
          <option value="TCS">TCS</option>
          <option value="HDFCBANK">HDFCBANK</option>
          <option value="INFY">INFY</option>
          <option value="WIPRO">WIPRO</option>
          <option value="ICICIBANK">ICICIBANK</option>
          <option value="SBIN">SBIN</option>
          <option value="BHARTIARTL">BHARTIARTL</option>
        </select>
      </div>

      {/* Stock Info */}
      {marketData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {marketData.slice(0, 4).map((stock) => (
            <div key={stock.symbol} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{stock.symbol}</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">₹{stock.ltp.toFixed(2)}</div>
                </div>
                <div className={`flex items-center ${
                  stock.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <TrendingUp className={`h-4 w-4 mr-1 ${!stock.isPositive ? 'rotate-180' : ''}`} />
                  <span className="text-sm font-medium">
                    {stock.isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* TradingView Chart */}
      <div className="card p-4 flex flex-col h-[calc(100vh-300px)] min-h-[600px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{selectedSymbol} Chart</h3>
          <a 
            href={`https://in.tradingview.com/chart/?symbol=${getTradingViewSymbol(selectedSymbol)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open in TradingView
          </a>
        </div>
        
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div id="tradingview_chart" className="w-full h-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Charts;