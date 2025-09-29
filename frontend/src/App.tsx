import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Positions from './pages/dashboard/Positions';
import Orders from './pages/dashboard/Orders';
import OrdersHistory from './pages/dashboard/OrdersHistory';
import BasketOrders from './pages/dashboard/BasketOrders';
import Charts from './pages/dashboard/Charts';
import Watchlist from './pages/dashboard/Watchlist';
import Portfolio from './pages/dashboard/Portfolio';
import OptionChain from './pages/dashboard/OptionChain';
import OHLCChart from './pages/dashboard/OHLCChart';
import AuthRequired from './components/auth/AuthRequired';

// AlgoTrading component
const AlgoTrading = () => {
  const [code, setCode] = React.useState('');
  const [algoName, setAlgoName] = React.useState('');
  const [algorithms, setAlgorithms] = React.useState([]);

  const saveAlgorithm = () => {
    if (!algoName.trim() || !code.trim()) return;
    const newAlgo = {
      id: Date.now().toString(),
      name: algoName,
      code,
      isActive: false
    };
    const updated = [...algorithms, newAlgo];
    setAlgorithms(updated);
    localStorage.setItem('trading_algorithms', JSON.stringify(updated));
    setAlgoName('');
    setCode('');
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('trading_algorithms');
    if (saved) setAlgorithms(JSON.parse(saved));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Algorithmic Trading</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-medium mb-4">Algorithm Editor</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Algorithm name"
              value={algoName}
              onChange={(e) => setAlgoName(e.target.value)}
              className="input"
            />
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input font-mono text-sm h-64 resize-none"
              placeholder="Enter your trading algorithm..."
            />
            <button
              onClick={saveAlgorithm}
              disabled={!algoName.trim() || !code.trim()}
              className="btn-primary disabled:opacity-50"
            >
              Save Algorithm
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-medium mb-4">Saved Algorithms</h2>
          <div className="space-y-3">
            {algorithms.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No algorithms saved</p>
            ) : (
              algorithms.map((algo) => (
                <div key={algo.id} className="border rounded-lg p-4">
                  <h3 className="font-medium">{algo.name}</h3>
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto">
                    {algo.code.substring(0, 100)}...
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={
            <AuthRequired>
              <DashboardLayout />
            </AuthRequired>
          }>
            <Route index element={<Dashboard />} />
            <Route path="portfolio">
              <Route index element={<Portfolio />} />
              <Route path="positions" element={<Positions />} />
              <Route path="orders" element={<Orders />} />
              <Route path="basket-orders" element={<BasketOrders />} />
            </Route>
            <Route path="orders" element={<OrdersHistory />} />
            <Route path="charts" element={<Charts />} />
            <Route path="watchlist" element={<Watchlist />} />
            <Route path="option-chain" element={<OptionChain />} />
            <Route path="ohlc-chart" element={<OHLCChart />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;