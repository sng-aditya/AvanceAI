import React, { useEffect, useRef } from 'react';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  symbol: string;
  height?: number;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, symbol, height = 400 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    const prices = data.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const candleWidth = Math.max(2, chartWidth / data.length - 2);

    // Grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
      
      const price = maxPrice - (priceRange / 5) * i;
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`₹${price.toFixed(2)}`, padding - 5, y + 4);
    }

    // Candlesticks
    data.forEach((candle, index) => {
      const x = padding + (chartWidth / data.length) * index + (chartWidth / data.length - candleWidth) / 2;
      
      const openY = padding + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding + ((maxPrice - candle.close) / priceRange) * chartHeight;
      const highY = padding + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding + ((maxPrice - candle.low) / priceRange) * chartHeight;

      const isGreen = candle.close > candle.open;
      
      // Wick
      ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = isGreen ? '#10b981' : '#ef4444';
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY);
      
      if (bodyHeight < 1) {
        ctx.strokeStyle = isGreen ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, openY);
        ctx.lineTo(x + candleWidth, openY);
        ctx.stroke();
      } else {
        ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
      }
    });

    // Time labels
    const timeStep = Math.max(1, Math.floor(data.length / 6));
    for (let i = 0; i < data.length; i += timeStep) {
      const x = padding + (chartWidth / data.length) * i;
      const time = new Date(data[i].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(time, x, canvas.height - 10);
    }

  }, [data, height]);

  const sampleData = React.useMemo(() => {
    if (data.length > 0) return data;
    
    const now = new Date();
    const samples: CandleData[] = [];
    let price = 100;
    
    for (let i = 0; i < 50; i++) {
      const time = new Date(now.getTime() - (50 - i) * 60000).toISOString();
      const open = price;
      const change = (Math.random() - 0.5) * 4;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      
      samples.push({ time, open, high, low, close });
      price = close;
    }
    
    return samples;
  }, [data]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{symbol} Chart</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
            <span>Bullish</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
            <span>Bearish</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: `${height}px` }}
        />
      </div>
      
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        {sampleData.length > 0 && (
          <>Last updated: {new Date(sampleData[sampleData.length - 1].time).toLocaleString()}</>
        )}
      </div>
    </div>
  );
};

export default CandlestickChart;