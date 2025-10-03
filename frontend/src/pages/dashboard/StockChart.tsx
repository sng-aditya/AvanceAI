import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BarChart3, ArrowLeft, Calendar, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { authenticatedFetch } from '../../utils/api';
import CandlestickChart from '../../components/charts/CandlestickChart';

interface OHLCData {
  timestamp: number[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const StockChart: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const symbol = searchParams.get('symbol') || 'RELIANCE';
  
  const [ohlcData, setOhlcData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1d' | '3d' | '5d' | '1w' | '1m'>('1d');
  const [metadata, setMetadata] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);

  const calculateDateRange = (range: string): { fromDate: string; toDate: string } => {
    const today = new Date();
    const toDate = today.toISOString().split('T')[0];
    let fromDate: string;

    switch (range) {
      case '1d':
        fromDate = toDate; // Same day for intraday
        break;
      case '3d':
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);
        fromDate = threeDaysAgo.toISOString().split('T')[0];
        break;
      case '5d':
        const fiveDaysAgo = new Date(today);
        fiveDaysAgo.setDate(today.getDate() - 5);
        fromDate = fiveDaysAgo.toISOString().split('T')[0];
        break;
      case '1w':
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        fromDate = oneWeekAgo.toISOString().split('T')[0];
        break;
      case '1m':
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);
        fromDate = oneMonthAgo.toISOString().split('T')[0];
        break;
      default:
        fromDate = toDate;
    }

    return { fromDate, toDate };
  };

  const fetchOHLCData = async (range: string) => {
    try {
      setLoading(true);
      setError(null);

      const { fromDate, toDate } = calculateDateRange(range);
      const response = await authenticatedFetch(
        `/market/stock-ohlc/${symbol}?fromDate=${fromDate}&toDate=${toDate}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch OHLC data: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const rawData: OHLCData = result.data;
        
        // Convert to CandleData format
        const candles: CandleData[] = [];
        const length = rawData.timestamp?.length || 0;

        for (let i = 0; i < length; i++) {
          candles.push({
            time: new Date(rawData.timestamp[i] * 1000).toISOString(),
            open: rawData.open[i],
            high: rawData.high[i],
            low: rawData.low[i],
            close: rawData.close[i],
            volume: rawData.volume[i]
          });
        }

        setOhlcData(candles);
        setMetadata(result.metadata);

        // Calculate price change
        if (candles.length > 0) {
          const latest = candles[candles.length - 1];
          const first = candles[0];
          setCurrentPrice(latest.close);
          const change = latest.close - first.open;
          setPriceChange(change);
          setPriceChangePercent((change / first.open) * 100);
        }
      } else {
        setError(result.message || 'Failed to fetch OHLC data');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching OHLC data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOHLCData(timeRange);
  }, [symbol, timeRange]);

  const handleTimeRangeChange = (range: '1d' | '3d' | '5d' | '1w' | '1m') => {
    setTimeRange(range);
  };

  const handleRefresh = () => {
    fetchOHLCData(timeRange);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="h-6 w-6 mr-2" />
              {symbol} Chart
            </h1>
            {metadata && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {metadata.instrument} • {metadata.exchangeSegment}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="btn-secondary flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Price Info Card */}
      {currentPrice > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(currentPrice)}
              </div>
              <div className={`flex items-center mt-2 ${
                priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {priceChange >= 0 ? (
                  <TrendingUp className="h-5 w-5 mr-1" />
                ) : (
                  <TrendingDown className="h-5 w-5 mr-1" />
                )}
                <span className="text-lg font-medium">
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>

            {ohlcData.length > 0 && (
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Open</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(ohlcData[0].open)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">High</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(Math.max(...ohlcData.map(d => d.high)))}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Low</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(Math.min(...ohlcData.map(d => d.low)))}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">Volume</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {ohlcData.reduce((sum, d) => sum + d.volume, 0).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time Range Selector */}
      <div className="card p-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Range:</span>
          <div className="flex space-x-2">
            {(['1d', '3d', '5d', '1w', '1m'] as const).map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {range === '1d' ? '1 Day' : range === '3d' ? '3 Days' : range === '5d' ? '5 Days' : range === '1w' ? '1 Week' : '1 Month'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-4">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading chart data...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-96 text-red-600 dark:text-red-400">
            <div className="text-lg font-medium mb-2">Failed to load chart</div>
            <div className="text-sm">{error}</div>
            <button
              onClick={handleRefresh}
              className="mt-4 btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : ohlcData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
            <BarChart3 className="h-16 w-16 mb-4 opacity-50" />
            <div className="text-lg font-medium">No data available</div>
            <div className="text-sm">Try selecting a different time range</div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {symbol} - {timeRange === '1d' ? 'Intraday' : timeRange === '3d' ? '3 Days' : timeRange === '5d' ? '5 Days' : timeRange === '1w' ? '1 Week' : '1 Month'}
            </h3>
            <CandlestickChart data={ohlcData} symbol={symbol} height={500} />
          </div>
        )}
      </div>

      {/* Data Info */}
      {metadata && (
        <div className="card p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Data Source:</span> {metadata.source || 'API'}
              </div>
              <div>
                <span className="font-medium">Period:</span> {metadata.fromDate} to {metadata.toDate}
              </div>
              <div>
                <span className="font-medium">Candles:</span> {ohlcData.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockChart;
