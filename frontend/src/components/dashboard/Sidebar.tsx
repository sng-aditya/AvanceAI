import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  TrendingUp, 
  LayoutDashboard, 
  LineChart, 
  ChevronDown,
  FileStack,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type SidebarItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  hasSubMenu?: boolean;
  isExpanded?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
};

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  to, 
  icon, 
  label, 
  isActive, 
  hasSubMenu = false,
  isExpanded = false,
  onClick,
  children 
}) => {
  return (
    <div className="mb-1">
      <Link
        to={to}
        onClick={onClick}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          isActive 
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-100'
        }`}
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className="flex-1">{label}</span>
        {hasSubMenu && (
          <ChevronDown 
            size={18} 
            className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        )}
      </Link>
      
      {hasSubMenu && isExpanded && (
        <div className="ml-10 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [expandedMenu, setExpandedMenu] = useState<string | null>('portfolio'); // Default expanded

  const toggleMenu = (menu: string) => {
    setExpandedMenu(prev => prev === menu ? null : menu);
  };

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Handle click for items with submenus
  const handleParentClick = (e: React.MouseEvent, menu: string) => {
    e.preventDefault();
    toggleMenu(menu);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-dark-100 border-r border-gray-200 dark:border-gray-800">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <TrendingUp className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">InvestAI</span>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <SidebarItem
          to="/dashboard"
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          isActive={location.pathname === '/dashboard'}
        />
        
        <SidebarItem
          to="/dashboard/portfolio"
          icon={<FileStack size={20} />}
          label="Portfolio"
          isActive={isActive('/dashboard/portfolio')}
          hasSubMenu={true}
          isExpanded={expandedMenu === 'portfolio'}
          onClick={(e) => handleParentClick(e, 'portfolio')}
        >
          <Link
            to="/dashboard/portfolio/positions"
            className={`block py-2 pl-3 rounded-md text-sm ${
              isActive('/dashboard/portfolio/positions') 
                ? 'text-primary-600 dark:text-primary-400 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Positions
          </Link>
          <Link
            to="/dashboard/portfolio/orders"
            className={`block py-2 pl-3 rounded-md text-sm ${
              isActive('/dashboard/portfolio/orders') 
                ? 'text-primary-600 dark:text-primary-400 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Orders
          </Link>
          <Link
            to="/dashboard/portfolio/basket-orders"
            className={`block py-2 pl-3 rounded-md text-sm ${
              isActive('/dashboard/portfolio/basket-orders') 
                ? 'text-primary-600 dark:text-primary-400 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Basket Orders
          </Link>
        </SidebarItem>
        
        <SidebarItem
          to="/dashboard/orders"
          icon={<ShoppingCart size={20} />}
          label="Orders"
          isActive={isActive('/dashboard/orders')}
        />
        
        <SidebarItem
          to="/dashboard/watchlist"
          icon={<LineChart size={20} />}
          label="Watchlist"
          isActive={isActive('/dashboard/watchlist')}
        />
      </nav>
      
      {/* User info at bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button 
          onClick={handleLogout}
          className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-300 rounded-md transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;