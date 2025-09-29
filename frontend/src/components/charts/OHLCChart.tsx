import React from 'react';

interface OHLCData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  timestamp: number[];
}

interface OHLCChartProps {
  data: OHLCData;
  symbol: string;
  strike: string;
  optionType: string;
}

const OHLCChart: React.FC<OHLCChartProps> = ({ data, symbol, strike, optionType }) => {
  if (!data || !data.timestamp || data.timestamp.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="font-medium">No OHLC data available</p>
          <p className="text-sm">Data might not be available for this strike</p>
        </div>
      </div>
    );
  }

  // Prepare data for visualization
  const chartData = data.timestamp.map((timestamp, index) => ({
    time: new Date(timestamp * 1000).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    open: data.open[index] || 0,
    high: data.high[index] || 0,
    low: data.low[index] || 0,
    close: data.close[index] || 0,
    volume: data.volume[index] || 0
  }));

  // Calculate chart dimensions
  const width = 700;
  const height = 300;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find min/max values for scaling
  const allPrices = chartData.flatMap(d => [d.open, d.high, d.low, d.close]).filter(p => p > 0);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;

  // Scale functions
  const scaleX = (index: number) => padding + (index / (chartData.length - 1)) * chartWidth;
  const scaleY = (price: number) => padding + ((maxPrice - price) / priceRange) * chartHeight;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          {symbol} {strike} {optionType} - OHLC Chart
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {chartData.length} data points
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <g key={ratio}>
              <line
                x1={padding}
                y1={padding + ratio * chartHeight}
                x2={width - padding}
                y2={padding + ratio * chartHeight}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x={padding - 5}
                y={padding + ratio * chartHeight + 4}
                fontSize="10"
                fill="#6b7280"
                textAnchor="end"
              >
                {(maxPrice - ratio * priceRange).toFixed(2)}
              </text>
            </g>
          ))}

          {/* OHLC Candlesticks */}
          {chartData.map((candle, index) => {
            const x = scaleX(index);
            const openY = scaleY(candle.open);
            const highY = scaleY(candle.high);
            const lowY = scaleY(candle.low);
            const closeY = scaleY(candle.close);
            
            const isGreen = candle.close >= candle.open;
            const bodyTop = Math.min(openY, closeY);
            const bodyBottom = Math.max(openY, closeY);
            const bodyHeight = bodyBottom - bodyTop;

            return (
              <g key={index}>
                {/* High-Low line */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={isGreen ? "#16a34a" : "#dc2626"}
                  strokeWidth="1"
                />
                
                {/* Open-Close body */}
                <rect
                  x={x - 3}
                  y={bodyTop}
                  width="6"
                  height={Math.max(bodyHeight, 1)}
                  fill={isGreen ? "#16a34a" : "#dc2626"}
                  opacity={isGreen ? 0.8 : 1}
                />
              </g>
            );
          })}

          {/* X-axis labels */}
          {chartData.map((candle, index) => {
            if (index % Math.ceil(chartData.length / 6) === 0) {
              return (
                <text
                  key={index}
                  x={scaleX(index)}
                  y={height - padding + 15}
                  fontSize="10"
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  {candle.time}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
          <div className="text-gray-600 dark:text-gray-400">Open</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {chartData[0]?.open.toFixed(2) || '-'}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
          <div className="text-gray-600 dark:text-gray-400">High</div>
          <div className="font-medium text-green-600 dark:text-green-400">
            {maxPrice.toFixed(2)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
          <div className="text-gray-600 dark:text-gray-400">Low</div>
          <div className="font-medium text-red-600 dark:text-red-400">
            {minPrice.toFixed(2)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
          <div className="text-gray-600 dark:text-gray-400">Close</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {chartData[chartData.length - 1]?.close.toFixed(2) || '-'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OHLCChart;