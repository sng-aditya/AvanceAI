import React from 'react';

interface OHLCData {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  timestamp: number[];
}

interface HistoryEntry {
  timestamp: Date;
  data: OHLCData;
  source?: string;
}

interface TableRow {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  fetchTime: string;
}

interface OHLCTableProps {
  data: OHLCData;
  symbol: string;
  strike: string;
  optionType: string;
  history?: HistoryEntry[];
}

const OHLCTable: React.FC<OHLCTableProps> = ({ data, symbol, strike, optionType, history = [] }) => {
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);
  
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

  // Combine current data with history
  const allData: TableRow[] = [];
  
  // Add historical data
  history.forEach(entry => {
    if (entry.data && entry.data.timestamp) {
      entry.data.timestamp.forEach((timestamp: number, index: number) => {
        allData.push({
          time: new Date(timestamp * 1000).toLocaleString('en-IN'),
          open: entry.data.open[index] || 0,
          high: entry.data.high[index] || 0,
          low: entry.data.low[index] || 0,
          close: entry.data.close[index] || 0,
          volume: entry.data.volume[index] || 0,
          fetchTime: entry.timestamp.toLocaleString('en-IN')
        });
      });
    }
  });
  
  // Add current data
  if (data.timestamp) {
    data.timestamp.forEach((timestamp, index) => {
      allData.push({
        time: new Date(timestamp * 1000).toLocaleString('en-IN'),
        open: data.open[index] || 0,
        high: data.high[index] || 0,
        low: data.low[index] || 0,
        close: data.close[index] || 0,
        volume: data.volume[index] || 0,
        fetchTime: new Date().toLocaleString('en-IN')
      });
    });
  }
  
  // Remove duplicates and sort by time (OLDEST FIRST for bottom insertion)
  const tableData = allData
    .filter((item, index, self) => 
      index === self.findIndex(t => t.time === item.time)
    )
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    
  // Auto-scroll to bottom when new data arrives
  React.useEffect(() => {
    if (shouldAutoScroll && tableContainerRef.current) {
      tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
    }
  }, [tableData.length, shouldAutoScroll]);
  
  // Handle manual scroll to detect if user scrolled up
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
    setShouldAutoScroll(isAtBottom);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          {symbol} {strike} {optionType} - OHLC Data
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {tableData.length} data points
        </p>
      </div>

      <div className="space-y-2">
        {!shouldAutoScroll && (
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-2 text-center">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              🔄 Auto-scroll paused. 
              <button 
                onClick={() => {
                  setShouldAutoScroll(true);
                  if (tableContainerRef.current) {
                    tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
                  }
                }}
                className="underline hover:no-underline ml-1"
              >
                Resume auto-scroll
              </button>
            </p>
          </div>
        )}
        
        <div 
          ref={tableContainerRef}
          onScroll={handleScroll}
          className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                Time
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                Open
              </th>
              <th className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400 border-r border-gray-200 dark:border-gray-600">
                High
              </th>
              <th className="px-4 py-3 text-right font-medium text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-gray-600">
                Low
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                Close
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                Volume
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                Fetched At
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr 
                key={index} 
                className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <td className="px-4 py-3 text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-700 font-mono text-xs">
                  {row.time}
                </td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-700 font-mono">
                  {row.open.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 border-r border-gray-100 dark:border-gray-700 font-mono font-medium">
                  {row.high.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 border-r border-gray-100 dark:border-gray-700 font-mono font-medium">
                  {row.low.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-700 font-mono">
                  {row.close.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-mono border-r border-gray-100 dark:border-gray-700">
                  {row.volume.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                  {row.fetchTime}
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
          <div className="text-gray-600 dark:text-gray-400">Total Records</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {tableData.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
          <div className="text-gray-600 dark:text-gray-400">Highest Price</div>
          <div className="font-medium text-green-600 dark:text-green-400">
            {Math.max(...tableData.map(r => r.high)).toFixed(2)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
          <div className="text-gray-600 dark:text-gray-400">Lowest Price</div>
          <div className="font-medium text-red-600 dark:text-red-400">
            {Math.min(...tableData.map(r => r.low)).toFixed(2)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
          <div className="text-gray-600 dark:text-gray-400">Total Volume</div>
          <div className="font-medium text-gray-900 dark:text-white">
            {tableData.reduce((sum, r) => sum + r.volume, 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OHLCTable;