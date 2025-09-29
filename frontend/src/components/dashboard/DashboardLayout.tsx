import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';

const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopBar />
      <main className="px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;