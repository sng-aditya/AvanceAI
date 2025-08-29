import React from 'react';
import { LineChart, BarChart, PieChart, TrendingUp, Zap } from 'lucide-react';

const FinanceAnimation: React.FC = () => {
  return (
    <div className="relative h-[400px] w-full bg-white dark:bg-dark-100 rounded-2xl shadow-xl overflow-hidden p-6 pointer-events-none z-0">
      {/* Background grid */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 gap-4 opacity-10">
        {Array.from({ length: 12 }).map((_, rowIndex) => (
          Array.from({ length: 12 }).map((_, colIndex) => (
            <div 
              key={`${rowIndex}-${colIndex}`} 
              className="border border-gray-300 dark:border-gray-700"
            />
          ))
        ))}
      </div>
      
      {/* Moving elements */}
      {Array.from({ length: 15 }).map((_, index) => (
        <div 
          key={index}
          className="finance-dot absolute" 
          style={{
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${6 + Math.random() * 4}s`
          }}
        />
      ))}
      
      {/* Charts and graphs */}
      <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-dark-100 rounded-lg shadow-lg p-4 animate-pulse-slow">
        <LineChart className="h-12 w-12 text-primary-500" />
      </div>
      
      <div className="absolute top-3/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-dark-100 rounded-lg shadow-lg p-4 animate-pulse-slow" style={{ animationDelay: '1s' }}>
        <BarChart className="h-10 w-10 text-secondary-500" />
      </div>
      
      <div className="absolute top-1/3 right-1/4 transform translate-x-1/2 -translate-y-1/2 bg-white dark:bg-dark-100 rounded-lg shadow-lg p-4 animate-pulse-slow" style={{ animationDelay: '2s' }}>
        <PieChart className="h-14 w-14 text-accent-500" />
      </div>
      
      <div className="absolute bottom-1/4 right-1/3 transform translate-x-1/2 translate-y-1/2 bg-white dark:bg-dark-100 rounded-lg shadow-lg p-4 animate-pulse-slow" style={{ animationDelay: '1.5s' }}>
        <TrendingUp className="h-12 w-12 text-success-500" />
      </div>
      
      {/* Central element */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-500 rounded-full shadow-lg p-5">
        <Zap className="h-10 w-10 text-white" />
      </div>
      
      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <line x1="25%" y1="25%" x2="50%" y2="50%" className="stroke-primary-300 dark:stroke-primary-800 stroke-1 opacity-50" />
        <line x1="75%" y1="33%" x2="50%" y2="50%" className="stroke-secondary-300 dark:stroke-secondary-800 stroke-1 opacity-50" />
        <line x1="33%" y1="75%" x2="50%" y2="50%" className="stroke-accent-300 dark:stroke-accent-800 stroke-1 opacity-50" />
        <line x1="67%" y1="75%" x2="50%" y2="50%" className="stroke-success-300 dark:stroke-success-800 stroke-1 opacity-50" />
      </svg>
    </div>
  );
};

export default FinanceAnimation;