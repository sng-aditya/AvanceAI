import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';

const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar />
      <main className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;