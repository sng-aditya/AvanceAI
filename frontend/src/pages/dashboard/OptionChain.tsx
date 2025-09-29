import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useOptionChain } from '../../hooks/useOptionChain';

const OptionChain: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const symbol = searchParams.get('symbol') || '';
  
  const {
    expiryDates,
    selectedExpiry,
    optionChain,
    loadingOptionChain,
    autoRefreshEnabled,
    lastUpdateTime,
    chartContext,
    fetchOptionChain,
    toggleAutoRefresh,
    openChart,
    closeChart,
    getFilteredStrikes
  } = useOptionChain(symbol);

  if (!symbol) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Option Chain</h1>
          <p className="text-gray-600 dark:text-gray-400">No symbol provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Symbol and Current Price */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{symbol}</h1>
          {optionChain && optionChain.last_price && (
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {optionChain.last_price.toFixed(2)}
                </div>
                {optionChain.ohlc?.close && (
                  <div className={`text-lg font-medium ${
                    optionChain.last_price >= optionChain.ohlc.close 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {optionChain.last_price >= optionChain.ohlc.close ? '+' : ''}
                    {(optionChain.last_price - optionChain.ohlc.close).toFixed(2)} 
                    ({((optionChain.last_price - optionChain.ohlc.close) / optionChain.ohlc.close * 100).toFixed(2)}%)
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end space-y-1">
                {lastUpdateTime && (
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{lastUpdateTime.toLocaleTimeString()}</span>
                  </div>
                )}
                <button
                  onClick={toggleAutoRefresh}
                  className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {autoRefreshEnabled ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side - OHLC and Expiry */}
        <div className="lg:col-span-1 space-y-6">
          {/* OHLC Data */}
          {optionChain && optionChain.ohlc && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">OHLC</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Open</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {optionChain.ohlc.open?.toFixed(2) || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">High</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {optionChain.ohlc.high?.toFixed(2) || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Low</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {optionChain.ohlc.low?.toFixed(2) || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Close</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {optionChain.ohlc.close?.toFixed(2) || '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Expiry Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expiry Dates</h3>
            
            {/* Primary Expiry Buttons */}
            <div className="space-y-2 mb-4">
              {expiryDates.slice(0, 2).map((date, index) => (
                <button
                  key={index}
                  onClick={() => fetchOptionChain(date)}
                  className={`w-full p-3 text-left rounded-lg transition-colors border ${
                    selectedExpiry === date
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {new Date(date).toLocaleDateString('en-IN', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{date}</div>
                </button>
              ))}
            </div>

            {/* Dropdown for Additional Dates */}
            {expiryDates.length > 2 && (
              <select
                onChange={(e) => e.target.value && fetchOptionChain(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                defaultValue=""
              >
                <option value="">More dates...</option>
                {expiryDates.slice(2).map((date, index) => (
                  <option key={index} value={date}>
                    {new Date(date).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short' 
                    })} - {date}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Right Side - Option Chain */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Options Chain</h3>
            </div>
            
            <div className="relative">
              {loadingOptionChain ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-4"></div>
                  <p className="font-medium">Loading options data...</p>
                </div>
              ) : optionChain ? (
                <div className="max-h-[600px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">CE LTP</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">CE Change</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-600 border-r border-gray-200 dark:border-gray-600">STRIKE</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">PE Change</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">PE LTP</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredStrikes(optionChain?.last_price || 0).map((item: any, index: number) => {
                        const [strike, data] = item;
                        const ceData = data.CE || data.ce || {};
                        const peData = data.PE || data.pe || {};
                        
                        const ceChangePercent = (ceData.prev_close_price || ceData.previous_close_price) ? 
                          (((ceData.ltp || ceData.last_price) - (ceData.prev_close_price || ceData.previous_close_price)) / (ceData.prev_close_price || ceData.previous_close_price)) * 100 : 0;
                        
                        const peChangePercent = (peData.prev_close_price || peData.previous_close_price) ? 
                          (((peData.ltp || peData.last_price) - (peData.prev_close_price || peData.previous_close_price)) / (peData.prev_close_price || peData.previous_close_price)) * 100 : 0;
                        
                        const strikePrice = parseFloat(strike);
                        const currentPrice = optionChain.last_price || 0;
                        const isAtMoney = Math.abs(strikePrice - currentPrice) <= 50;
                        const isCurrentPrice = index === Math.floor(getFilteredStrikes(currentPrice).length / 2);
                        
                        return (
                          <React.Fragment key={strike}>
                            {/* Current Value Line */}
                            {isCurrentPrice && (
                              <tr>
                                <td colSpan={5} className="px-0 py-0">
                                  <div className="flex items-center bg-gray-900 dark:bg-white">
                                    <div className="flex-1 h-0.5 bg-gray-900 dark:bg-white"></div>
                                    <div className="px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold">
                                      Current Value: {currentPrice.toFixed(2)}
                                    </div>
                                    <div className="flex-1 h-0.5 bg-gray-900 dark:bg-white"></div>
                                  </div>
                                </td>
                              </tr>
                            )}
                            
                            <tr className={`group hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 ${isAtMoney ? 'bg-gray-50 dark:bg-gray-800' : ''}`}>
                              {/* CE LTP */}
                              <td className="px-4 py-3 text-center font-medium border-r border-gray-100 dark:border-gray-700">
                                {(ceData.ltp || ceData.last_price || ceData.lastPrice || 0).toFixed(2)}
                              </td>
                              
                              {/* CE Change */}
                              <td className={`px-4 py-3 text-center border-r border-gray-100 dark:border-gray-700 ${ceChangePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {ceChangePercent !== 0 ? (
                                  <div>
                                    <div className="font-medium">
                                      {ceChangePercent >= 0 ? '+' : ''}{((ceData.ltp || ceData.last_price) - (ceData.prev_close_price || ceData.previous_close_price || 0)).toFixed(2)}
                                    </div>
                                    <div className="text-xs">
                                      ({ceChangePercent >= 0 ? '+' : ''}{ceChangePercent.toFixed(1)}%)
                                    </div>
                                  </div>
                                ) : '-'}
                              </td>
                              
                              {/* Strike Price */}
                              <td className={`px-4 py-3 text-center font-bold border-r border-gray-100 dark:border-gray-700 ${isAtMoney ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white' : 'bg-gray-50 dark:bg-gray-700'}`}>
                                {parseFloat(strike).toFixed(0)}
                              </td>
                              
                              {/* PE Change */}
                              <td className={`px-4 py-3 text-center border-r border-gray-100 dark:border-gray-700 ${peChangePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {peChangePercent !== 0 ? (
                                  <div>
                                    <div className="font-medium">
                                      {peChangePercent >= 0 ? '+' : ''}{((peData.ltp || peData.last_price) - (peData.prev_close_price || peData.previous_close_price || 0)).toFixed(2)}
                                    </div>
                                    <div className="text-xs">
                                      ({peChangePercent >= 0 ? '+' : ''}{peChangePercent.toFixed(1)}%)
                                    </div>
                                  </div>
                                ) : '-'}
                              </td>
                              
                              {/* PE LTP */}
                              <td className="px-4 py-3 text-center font-medium border-r border-gray-100 dark:border-gray-700">
                                {(peData.ltp || peData.last_price || peData.lastPrice || 0).toFixed(2)}
                              </td>
                              {/* Actions */}
                              <td className="px-2 py-2 text-center">
                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => alert(`BUY placeholder: ${symbol} ${strike}`)}
                                    className="px-2 py-1 text-[10px] font-semibold rounded bg-green-600 text-white hover:bg-green-700"
                                    title="Buy (placeholder)"
                                  >B</button>
                                  <button
                                    onClick={() => alert(`SELL placeholder: ${symbol} ${strike}`)}
                                    className="px-2 py-1 text-[10px] font-semibold rounded bg-red-600 text-white hover:bg-red-700"
                                    title="Sell (placeholder)"
                                  >S</button>
                                  <button
                                    onClick={() => navigate(`/dashboard/ohlc-chart?symbol=${symbol}&strike=${strike}&type=CE&expiry=${selectedExpiry}`)}
                                    className="px-2 py-1 text-[10px] font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
                                    title="CE Chart"
                                  >📈</button>
                                  <button
                                    onClick={() => navigate(`/dashboard/ohlc-chart?symbol=${symbol}&strike=${strike}&type=PE&expiry=${selectedExpiry}`)}
                                    className="px-2 py-1 text-[10px] font-semibold rounded bg-purple-600 text-white hover:bg-purple-700"
                                    title="PE Chart"
                                  >📊</button>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <p className="font-medium">Select an expiry date</p>
                  <p className="text-sm">Choose from the expiry dates to view options chain</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OptionChain;