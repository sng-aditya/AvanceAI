const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return await response.json();
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return await response.json();
}

export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  return await response.json();
}

export async function logout(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }
}

// Utility function for authenticated API calls
export async function authenticatedFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Handle full URLs or relative endpoints
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include'
  });

  return response;
}

// Order-related interfaces and functions
export interface OrderData {
  symbol: string;
  quantity: number;
  orderType: 'BUY' | 'SELL';
  priceType: 'MARKET' | 'LIMIT';
  limitPrice?: number;
  exchangeSegment?: string;
  productType?: string;
  validity?: string;
}

export interface OrderResponse {
  success: boolean;
  data?: {
    orderId: string;
    status: string;
    orderDetails: any;
    message: string;
  };
  error?: string;
  errorDetails?: any;
}

export async function placeOrder(orderData: OrderData): Promise<OrderResponse> {
  const response = await authenticatedFetch('/orders/place', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });

  const result = await response.json();
  
  // Dispatch custom event when order is placed successfully
  if (result.success) {
    // New event name to indicate placement; keep legacy for compatibility
    const detail = { orderData, result };
    window.dispatchEvent(new CustomEvent('orderPlaced', { detail }));
    window.dispatchEvent(new CustomEvent('orderExecuted', { detail }));
  }
  
  return result;
}

// Function to manually trigger position updates
export function triggerPositionUpdate(): void {
  window.dispatchEvent(new CustomEvent('positionUpdate'));
}

// Function to trigger holdings update
export function triggerHoldingsUpdate(): void {
  window.dispatchEvent(new CustomEvent('holdingsUpdate'));
}

export async function getOrderHistory(): Promise<any> {
  const response = await authenticatedFetch('/orders/history');
  return await response.json();
}

export async function getOrderDetails(orderId: string): Promise<any> {
  const response = await authenticatedFetch(`/orders/${orderId}`);
  return await response.json();
}

export async function syncOrders(): Promise<any> {
  const response = await authenticatedFetch('/orders/sync', { method: 'POST' });
  return await response.json();
}

// Watchlist types & functions
export interface WatchlistItem {
  _id: string;
  symbol: string;
  exchange?: string;
  createdAt?: string;
  market?: {
    symbol: string;
    ltp?: number;
    change?: number;
    changePercent?: number;
  } | null;
}

export interface WatchlistResponse {
  success: boolean;
  data: WatchlistItem[];
  message?: string;
  error?: string;
}

export async function getWatchlist(): Promise<WatchlistResponse> {
  const res = await authenticatedFetch('/watchlist');
  return res.json();
}

export async function addWatchlistSymbol(symbol: string, exchange: string = 'NSE_EQ'): Promise<any> {
  const res = await authenticatedFetch('/watchlist', {
    method: 'POST',
    body: JSON.stringify({ symbol, exchange })
  });
  return res.json();
}

export async function removeWatchlistSymbol(symbol: string): Promise<any> {
  const res = await authenticatedFetch(`/watchlist/${symbol}`, { method: 'DELETE' });
  return res.json();
}