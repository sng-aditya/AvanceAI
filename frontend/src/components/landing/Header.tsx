import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when changing location
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-dark-200/95 shadow-md backdrop-blur-sm py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <TrendingUp className={`h-8 w-8 ${isScrolled ? 'text-primary-600 dark:text-primary-400' : 'text-primary-600 dark:text-white'}`} />
            <span className={`text-xl font-bold ${isScrolled ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
              InvestAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/#features" 
              className={`${isScrolled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'} hover:text-primary-600 dark:hover:text-primary-400 transition-colors`}
            >
              Features
            </Link>
            <Link 
              to="/#testimonials" 
              className={`${isScrolled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'} hover:text-primary-600 dark:hover:text-primary-400 transition-colors`}
            >
              Testimonials
            </Link>
            <Link 
              to="/#pricing" 
              className={`${isScrolled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'} hover:text-primary-600 dark:hover:text-primary-400 transition-colors`}
            >
              Pricing
            </Link>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-dark-100"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg\" className="h-5 w-5 text-yellow-500\" fill="none\" viewBox="0 0 24 24\" stroke="currentColor">
                  <path strokeLinecap="round\" strokeLinejoin="round\" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <Link 
              to="/login" 
              className="btn-primary py-2 px-4"
            >
              Login
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-4 md:hidden">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-dark-100"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg\" className="h-5 w-5 text-yellow-500\" fill="none\" viewBox="0 0 24 24\" stroke="currentColor">
                  <path strokeLinecap="round\" strokeLinejoin="round\" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg ${isScrolled ? 'text-gray-700 dark:text-white' : 'text-gray-900 dark:text-white'}`}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-dark-200 shadow-lg">
          <div className="px-4 py-2 space-y-1 divide-y divide-gray-200 dark:divide-gray-700">
            <Link 
              to="/#features" 
              className="block py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
            >
              Features
            </Link>
            <Link 
              to="/#testimonials" 
              className="block py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
            >
              Testimonials
            </Link>
            <Link 
              to="/#pricing" 
              className="block py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
            >
              Pricing
            </Link>
            <Link 
              to="/login" 
              className="block py-3 text-primary-600 dark:text-primary-400 font-medium"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;