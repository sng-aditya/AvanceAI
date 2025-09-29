import { useState, useEffect, useRef, useCallback } from 'react';
import { authenticatedFetch } from '../utils/api';

interface OptionChainData {
  oc?: any;
  last_price?: number;
  metadata?: any;
  symbol?: string;
  expiry?: string;
  ohlc?: {
    open?: number;
    high?: number;
    low?: number;
    close?: number;
  };
}

interface ChartContextState {
  open: boolean;
  strike?: string;
  ce?: any;
  pe?: any;
  ohlcData?: any;
  loading?: boolean;
  optionType?: 'CE' | 'PE';
  ohlcHistory?: any[];
}

export function useOptionChain(symbol: string) {
  const [expiryDates, setExpiryDates] = useState<string[]>([]);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [optionChain, setOptionChain] = useState<OptionChainData | null>(null);
  const [loadingExpiry, setLoadingExpiry] = useState(false);
  const [loadingOptionChain, setLoadingOptionChain] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [priceHistory, setPriceHistory] = useState<Record<string, { t: number; ce?: number; pe?: number }[]>>({});
  const [chartContext, setChartContext] = useState<ChartContextState>({ open: false, ohlcHistory: [] });
  const refreshTimerRef = useRef<number | null>(null);
  const ohlcRefreshTimerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const clearOhlcTimer = () => {
    if (ohlcRefreshTimerRef.current) {
      clearInterval(ohlcRefreshTimerRef.current);
      ohlcRefreshTimerRef.current = null;
    }
  };

  const fetchOhlcData = async (strike: string, optionType: 'CE' | 'PE') => {
    try {
      const response = await authenticatedFetch(`/market/strike-ohlc/${symbol}/${selectedExpiry}/${strike}/${optionType}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setChartContext(prev => {
          const history = prev.ohlcHistory || [];
          const newEntry = { timestamp: new Date(), data: data.data };
          const updatedHistory = [...history, newEntry].slice(-100);
          
          return {
            ...prev,
            ohlcData: data.data,
            ohlcHistory: updatedHistory,
            loading: false
          };
        });
      }
    } catch (error) {
      console.error('Failed to fetch OHLC data:', error);
    }
  };

  const startOhlcAutoRefresh = (strike: string, optionType: 'CE' | 'PE') => {
    clearOhlcTimer();
    fetchOhlcData(strike, optionType);
    const intervalId = window.setInterval(() => fetchOhlcData(strike, optionType), 60000);
    ohlcRefreshTimerRef.current = intervalId as unknown as number;
  };

  const openChart = async (strike: string, ceData: any, peData: any, optionType: 'CE' | 'PE' = 'CE') => {
    setChartContext({ open: true, strike, ce: ceData, pe: peData, loading: true, optionType, ohlcHistory: [] });
    startOhlcAutoRefresh(strike, optionType);
  };
  const closeChart = () => {
    clearOhlcTimer();
    setChartContext({ open: false, ohlcHistory: [] });
  };

  const updateHistory = (chainData: any) => {
    setPriceHistory(prev => {
      const updated = { ...prev };
      Object.entries(chainData || {}).forEach(([strike, payload]: any) => {
        const ceData = payload.CE || payload.ce;
        const peData = payload.PE || payload.pe;
        const ceLtp = ceData?.ltp || ceData?.last_price || ceData?.lastPrice;
        const peLtp = peData?.ltp || peData?.last_price || peData?.lastPrice;
        if (ceLtp == null && peLtp == null) return;
        const arr = updated[strike] ? [...updated[strike]] : [];
        const last = arr[arr.length - 1];
        if (!last || last.ce !== ceLtp || last.pe !== peLtp) {
          arr.push({ t: Date.now(), ce: ceLtp, pe: peLtp });
          if (arr.length > 200) arr.shift();
          updated[strike] = arr;
        }
      });
      return updated;
    });
  };

  const fetchExpiryDates = useCallback(async () => {
    if (!symbol) return;
    setLoadingExpiry(true);
    try {
      const response = await authenticatedFetch(`/market/expiry/${symbol}`);
      const data = await response.json();
      if (data.success) {
        setExpiryDates(data.data);
      } else {
        setExpiryDates([]);
      }
    } catch {
      setExpiryDates([]);
    } finally {
      setLoadingExpiry(false);
    }
  }, [symbol]);

  const fetchOptionChain = useCallback(async (expiry: string) => {
    if (!symbol || !expiry) return;
    setLoadingOptionChain(true);
    setSelectedExpiry(expiry);
    setOptionChain(null);
    clearTimer();
    try {
      const response = await authenticatedFetch(`/market/option-chain/${symbol}/${expiry}`);
      if (response.status === 429) throw new Error('Rate limited');
      const data = await response.json();
      if (data.success && data.data) {
        const chainData = data.data.oc;
        updateHistory(chainData);
        // Derive OHLC from market summary
        let ohlcData = null;
        try {
          const marketResponse = await authenticatedFetch('/market/summary');
          if (marketResponse.ok) {
            const market = await marketResponse.json();
            const indexData = market.data?.indices?.find((idx: any) => idx.symbol === symbol || idx.symbol.includes(symbol.replace('_', ' ')));
            if (indexData && (indexData.open || indexData.high || indexData.low || indexData.prevClose)) {
              ohlcData = {
                open: indexData.open,
                high: indexData.high,
                low: indexData.low,
                close: indexData.prevClose
              };
            }
          }
        } catch {}
        setOptionChain({
          oc: chainData,
            last_price: data.data.last_price,
            metadata: data.metadata,
            symbol,
            expiry,
            ohlc: ohlcData || undefined
        });
        setLastUpdateTime(new Date());
      } else {
        setOptionChain(null);
      }
    } catch {
      setOptionChain(null);
    } finally {
      setLoadingOptionChain(false);
      if (autoRefreshEnabled && expiry) startAutoRefresh(expiry);
    }
  }, [symbol, autoRefreshEnabled]);

  const fetchOptionChainUpdate = useCallback(async (expiry: string) => {
    if (!symbol || !expiry) return;
    try {
      const response = await authenticatedFetch(`/market/option-chain/${symbol}/${expiry}`);
      if (response.status === 429) return; // skip if rate limited
      const data = await response.json();
      if (data.success && data.data) {
        const chainData = data.data.oc;
        updateHistory(chainData);
        setOptionChain(prev => prev ? { ...prev, oc: chainData, last_price: data.data.last_price, metadata: data.metadata } : null);
        setLastUpdateTime(new Date());
      }
    } catch {}
  }, [symbol]);

  const startAutoRefresh = useCallback((expiry: string) => {
    clearTimer();
    if (!autoRefreshEnabled || !expiry) return;
    const id = window.setInterval(() => {
      if (autoRefreshEnabled) fetchOptionChainUpdate(expiry);
    }, 3000);
    refreshTimerRef.current = id as unknown as number;
  }, [autoRefreshEnabled, fetchOptionChainUpdate]);

  const toggleAutoRefresh = () => setAutoRefreshEnabled(v => !v);

  const getFilteredStrikes = useCallback((currentPrice: number) => {
    if (!optionChain?.oc) return [] as any[];
    const strikes = Object.entries(optionChain.oc)
      .map(([strike, data]) => [parseFloat(strike), data])
      .sort((a, b) => (a[0] as number) - (b[0] as number));
    const currentIndex = strikes.findIndex(([strike]) => (strike as number) >= currentPrice);
    const start = Math.max(0, currentIndex - 5);
    const end = Math.min(strikes.length, currentIndex + 6);
    return strikes.slice(start, end).map(([strike, data]) => [(strike as number).toString(), data]);
  }, [optionChain]);

  useEffect(() => {
    fetchExpiryDates();
    return () => {
      clearTimer();
      clearOhlcTimer();
    };
  }, [fetchExpiryDates]);

  useEffect(() => {
    if (selectedExpiry) {
      clearTimer();
      if (autoRefreshEnabled) startAutoRefresh(selectedExpiry);
    }
  }, [autoRefreshEnabled, selectedExpiry, startAutoRefresh]);

  return {
    expiryDates,
    selectedExpiry,
    optionChain,
    loadingExpiry,
    loadingOptionChain,
    autoRefreshEnabled,
    lastUpdateTime,
    priceHistory,
    chartContext,
    fetchOptionChain,
    toggleAutoRefresh,
    openChart,
    closeChart,
    getFilteredStrikes
  };
}
