import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import FinanceAnimation from './FinanceAnimation';

const Hero: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 dark:from-dark-200 dark:to-dark-300 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 max-w-lg">
            <span className="inline-block text-primary-600 dark:text-primary-400 font-medium text-sm md:text-base tracking-wide">
              Next-Gen Trading Platform
            </span>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
              Trade smart with {' '}
              <div className="text-rotate h-14 md:h-16 relative inline-block text-primary-600 dark:text-primary-400 w-full md:w-72">
                <span>automation</span>
                <span>algo</span>
                <span>strategy</span>
                <span>analytics</span>
              </div>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Build, backtest, and deploy sophisticated trading strategies with our cutting-edge algorithmic trading platform. Experience the future of trading today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link to="/login" className="btn-primary relative z-10">
                Go to dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>

              <button className="btn-secondary">
                <Play className="mr-2 h-5 w-5" />
                Watch demo
              </button>
            </div>
          </div>

          <div className="relative">
            <FinanceAnimation />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white dark:from-dark-200 to-transparent"></div>
    </div>
  );
};

export default Hero;