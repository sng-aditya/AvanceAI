import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '../../utils/api';
import OHLCTable from '../../components/charts/OHLCTable';
import CandlestickChart from '../../components/charts/CandlestickChart';

const OHLCChart: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [ohlcData, setOhlcData] = useState(null);
  const [dataSource, setDataSource] = useState<string>('');
  const [dataSourceMode, setDataSourceMode] = useState<'websocket' | 'api'>('websocket');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [ohlcHistory, setOhlcHistory] = useState<any[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [nextUpdateIn, setNextUpdateIn] = useState<number>(0);
  const refreshTimerRef = useRef<number | null>(null);
  const clockTimerRef = useRef<number | null>(null);
  
  const symbol = searchParams.get('symbol') || '';
  const strike = searchParams.get('strike') || '';
  const optionType = searchParams.get('type') || 'CE';
  const expiry = searchParams.get('expiry') || '';

  useEffect(() => {
    if (!symbol || !strike || !expiry) {
      navigate('/dashboard/option-chain');
      return;
    }
    
    // Clear existing timers and history when data source mode changes
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      clearTimeout(refreshTimerRef.current);
    }
    if (clockTimerRef.current) {
      clearInterval(clockTimerRef.current);
    }
    
    // Clear history when switching data source modes
    setOhlcHistory([]);
    setOhlcData(null);
    setNextUpdateIn(0);
    
    // Start real-time clock
    startClock();
    
    fetchOHLCData();
    startAutoRefresh();
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        clearTimeout(refreshTimerRef.current);
      }
      if (clockTimerRef.current) {
        clearInterval(clockTimerRef.current);
      }
    };
  }, [symbol, strike, optionType, expiry, dataSourceMode]);
  
  const startClock = () => {
    if (clockTimerRef.current) clearInterval(clockTimerRef.current);
    
    clockTimerRef.current = window.setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Calculate next update countdown for API mode
      if (dataSourceMode === 'api') {
        const secondsUntilNextMinute = 60 - now.getSeconds();
        setNextUpdateIn(secondsUntilNextMinute);
      } else {
        setNextUpdateIn(0);
      }
    }, 1000);
  };

  const fetchOHLCData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      console.log(`📊 Fetching OHLC: ${symbol} ${strike} ${optionType} (${dataSourceMode})`);
      const response = await authenticatedFetch(`/market/strike-ohlc/${symbol}/${expiry}/${strike}/${optionType}?dataSource=${dataSourceMode}`);
      const result = await response.json();
      
      console.log(`📊 OHLC Response:`, { 
        success: result.success, 
        source: result.source, 
        hasData: !!result.data,
        dataPoints: result.data?.timestamp?.length || 0
      });
      
      if (result.success && result.data) {
        setOhlcData(result.data);
        setDataSource(result.source || 'unknown');
        setLastUpdateTime(new Date());
        
        // Add to history only if it matches current data source mode
        const expectedSource = dataSourceMode === 'websocket' ? 'websocket_realtime' : 'api_historical';
        if (result.source === expectedSource) {
          setOhlcHistory(prev => {
            const newEntry = { 
              timestamp: new Date(), 
              data: result.data, 
              source: result.source,
              dataSourceMode: dataSourceMode
            };
            return [...prev, newEntry].slice(-100); // Keep last 100 entries
          });
        }
      } else {
        console.log(`ℹ️ No data available for ${dataSourceMode} mode:`, result.message);
        if (!isRefresh) {
          setOhlcData(null);
          setDataSource('');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching OHLC data:', error);
      if (!isRefresh) {
        setOhlcData(null);
        setDataSource('');
      }
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };
  
  const startAutoRefresh = () => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    
    if (dataSourceMode === 'websocket') {
      // WebSocket mode: 1 second interval
      console.log('🔄 Starting WebSocket auto-refresh: 1s interval');
      refreshTimerRef.current = window.setInterval(() => fetchOHLCData(true), 1000);
    } else {
      // API mode: Smart minute-based scheduling
      const scheduleNextAPICall = () => {
        const now = new Date();
        const secondsUntilNextMinute = 60 - now.getSeconds();
        const msUntilNextMinute = (secondsUntilNextMinute * 1000) - now.getMilliseconds();
        
        console.log(`🔄 API mode: Next call in ${secondsUntilNextMinute}s (at ${new Date(now.getTime() + msUntilNextMinute).toLocaleTimeString()})`);
        
        refreshTimerRef.current = window.setTimeout(() => {
          fetchOHLCData(true);
          // Schedule the next call for exactly 1 minute later
          refreshTimerRef.current = window.setInterval(() => fetchOHLCData(true), 60000);
        }, msUntilNextMinute);
      };
      
      scheduleNextAPICall();
    }
  };
  
  const formatDataForChart = (data: any) => {
    if (!data.timestamp) return [];
    
    return data.timestamp.map((timestamp: number, index: number) => ({
      time: new Date(timestamp * 1000).toISOString(),
      open: data.open[index] || 0,
      high: data.high[index] || 0,
      low: data.low[index] || 0,
      close: data.close[index] || 0,
      volume: data.volume[index] || 0
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {symbol} Strike {strike} {optionType}
            </h1>
            <div className="space-y-1">
              <p className="text-gray-600 dark:text-gray-400">
                Expiry: {expiry}
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900 px-3 py-1 rounded-lg">
                    <p className="text-sm font-mono font-medium text-blue-700 dark:text-blue-300">
                      🕰️ {currentTime.toLocaleTimeString('en-IN', { 
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>
                  {dataSource && (
                    <p className="text-sm font-medium">
                      <span className="text-gray-500 dark:text-gray-400">Source: </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        dataSource === 'websocket_realtime' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      }`}>
                        {dataSource === 'websocket_realtime' ? '⚡ Real-time' : '📈 Historical'}
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  {lastUpdateTime && (
                    <span>
                      Last updated: {lastUpdateTime.toLocaleTimeString('en-IN', { hour12: false })}
                    </span>
                  )}
                  {dataSourceMode === 'api' && nextUpdateIn > 0 && (
                    <span className="bg-orange-50 dark:bg-orange-900 px-2 py-1 rounded text-orange-700 dark:text-orange-300">
                      Next update in: {nextUpdateIn}s
                    </span>
                  )}
                  {dataSourceMode === 'websocket' && (
                    <span className="bg-green-50 dark:bg-green-900 px-2 py-1 rounded text-green-700 dark:text-green-300">
                      ⚡ Live updates every 1s
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={async () => {
                  console.log('🔄 Switching to WebSocket mode');
                  if (dataSourceMode !== 'websocket') {
                    try {
                      await authenticatedFetch('/market/clear-websocket-cache', { method: 'POST' });
                    } catch (error) {
                      console.warn('Failed to clear cache:', error);
                    }
                  }
                  setDataSourceMode('websocket');
                }}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  dataSourceMode === 'websocket' 
                    ? 'bg-green-500 text-white shadow' 
                    : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                ⚡ Real-time
              </button>
              <button
                onClick={async () => {
                  console.log('🔄 Switching to API mode');
                  if (dataSourceMode !== 'api') {
                    try {
                      await authenticatedFetch('/market/clear-websocket-cache', { method: 'POST' });
                    } catch (error) {
                      console.warn('Failed to clear cache:', error);
                    }
                  }
                  setDataSourceMode('api');
                }}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  dataSourceMode === 'api' 
                    ? 'bg-orange-500 text-white shadow' 
                    : 'text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                🔄 Historical
              </button>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              >
                Raw Data
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'chart' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
              >
                Chart
              </button>
            </div>
            <button
              onClick={() => navigate('/dashboard/option-chain')}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              ← Back
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading OHLC data...</span>
          </div>
        ) : ohlcData ? (
          viewMode === 'table' ? (
            <OHLCTable 
              data={ohlcData}
              symbol={symbol}
              strike={strike}
              optionType={optionType}
              history={ohlcHistory}
            />
          ) : (
            <CandlestickChart 
              data={formatDataForChart(ohlcData)}
              symbol={`${symbol} ${strike} ${optionType}`}
            />
          )
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 h-64 flex items-center justify-center">
            <div>
              <p className="font-medium">No OHLC data available</p>
              <p className="text-sm">Data might not be available for this strike</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OHLCChart;