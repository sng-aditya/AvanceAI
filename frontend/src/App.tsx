import { Routes, Route } from 'react-router-dom';
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
import Watchlist from './pages/dashboard/Watchlist';
import Portfolio from './pages/dashboard/Portfolio';
import OptionChain from './pages/dashboard/OptionChain';
import OHLCChart from './pages/dashboard/OHLCChart';
import StockChart from './pages/dashboard/StockChart';
import AuthRequired from './components/auth/AuthRequired';

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
            <Route path="stock-chart" element={<StockChart />} />
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