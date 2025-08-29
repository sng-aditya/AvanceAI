import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, ExternalLink } from 'lucide-react';

interface StockData {
  symbol: string;
  ltp: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

const Charts: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');
  const [marketData, setMarketData] = useState<StockData[]>([]);
  const [chartData, setChartData] = useState([]);

  const fetchMarketData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/market/summary', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
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


  return (
    <div className="space-y-6">
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
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{selectedSymbol} Chart</h3>
          <a 
            href={`https://in.tradingview.com/chart/?symbol=NSE:${selectedSymbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Open in TradingView
          </a>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <iframe
            key={selectedSymbol}
            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_${selectedSymbol}&symbol=NSE%3A${selectedSymbol}&interval=D&hidesidetoolbar=1&hidetoptoolbar=0&symboledit=1&saveimage=1&toolbarbg=F1F3F6&studies=[]&hideideas=1&theme=light&style=1&timezone=Etc%2FUTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=localhost&utm_medium=widget&utm_campaign=chart&utm_term=NSE%3A${selectedSymbol}`}
            width="100%"
            height="500"
            frameBorder="0"
            allowTransparency={true}
            scrolling="no"
            allowFullScreen={true}
          ></iframe>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Chart Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Frame
            </label>
            <select className="input">
              <option value="1m">1 Minute</option>
              <option value="5m">5 Minutes</option>
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="1d">1 Day</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Indicators
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">Moving Average (20)</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">RSI</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm">MACD</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chart Type
            </label>
            <select className="input">
              <option value="candlestick">Candlestick</option>
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;