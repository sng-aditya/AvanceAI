import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  wide?: boolean; // allow full-width variant when needed
}

// Provides consistent horizontal padding & max-width alignment across pages
const PageContainer: React.FC<PageContainerProps> = ({ children, className = '', wide = false }) => {
  return (
    <div className={`${wide ? 'max-w-7xl' : 'max-w-5xl'} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
