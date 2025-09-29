import { useState, useEffect, useCallback } from 'react';
import { authenticatedFetch } from '../utils/api';

interface MarketItem {
  symbol: string;
  ltp: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  isPositive: boolean;
  timestamp: string;
}

interface RealTimeData {
  stocks: MarketItem[];
  indices: MarketItem[];
  lastUpdate: string;
  source: string;
  count: number;
}

export const useRealTimeData = (refreshInterval: number = 1000) => {
  const [data, setData] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');

  const fetchRealTimeData = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/realtime/market-data');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.data);
          setConnectionStatus('connected');
          setError(null);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      console.error('Real-time data fetch error:', err);
      setConnectionStatus('disconnected');
      if (!data) {
        setError(err instanceof Error ? err.message : 'Failed to fetch real-time data');
      }
    } finally {
      setLoading(false);
    }
  }, [data]);

  const checkConnectionStatus = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/realtime/status');
      if (response.ok) {
        const result = await response.json();
        setConnectionStatus(result.data.connected ? 'connected' : 'disconnected');
      }
    } catch (err) {
      setConnectionStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchRealTimeData();
    checkConnectionStatus();
    
    const interval = setInterval(fetchRealTimeData, refreshInterval);
    const statusInterval = setInterval(checkConnectionStatus, 10000);
    
    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, [fetchRealTimeData, checkConnectionStatus, refreshInterval]);

  return {
    data,
    loading,
    error,
    connectionStatus,
    refresh: fetchRealTimeData
  };
};