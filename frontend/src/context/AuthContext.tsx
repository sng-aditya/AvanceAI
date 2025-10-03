import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser, logout as apiLogout, LoginData, RegisterData, User } from '../utils/api';
import heartbeatService from '../services/heartbeat';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await getCurrentUser(storedToken);
          setUser(userData);
          setToken(storedToken);
          // Start heartbeat for existing session
          heartbeatService.start();
        } catch (error) {
          console.error('Failed to fetch user:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    // Listen for session expiry events
    const handleSessionExpired = () => {
      console.log('Session expired, logging out...');
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      heartbeatService.stop();
      // You can also redirect to login page here if needed
      window.location.href = '/login';
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, []);

  const login = async (data: LoginData) => {
    try {
      const response = await apiLogin(data);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('token', response.token);
      // Start heartbeat after successful login
      heartbeatService.start();
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiRegister(data);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('token', response.token);
      // Start heartbeat after successful registration
      heartbeatService.start();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    // Stop heartbeat before logout
    heartbeatService.stop();
    
    try {
      if (token) {
        await apiLogout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};