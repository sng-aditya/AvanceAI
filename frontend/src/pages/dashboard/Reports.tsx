import React, { useState } from 'react';
import { Calendar, Download, Filter, ArrowDown, ArrowUp } from 'lucide-react';

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState('last30');
  const [reports, setReports] = useState([
    {
      id: 'REP001',
      name: 'Monthly Performance Summary',
      description: 'Overall trading performance for the month',
      date: '2023-09-01',
      type: 'Summary',
      size: '1.2 MB'
    },
    {
      id: 'REP002',
      name: 'Strategy Analysis - MA Crossover',
      description: 'Detailed analysis of the MA Crossover strategy',
      date: '2023-09-05',
      type: 'Strategy',
      size: '2.4 MB'
    },
    {
      id: 'REP003',
      name: 'Trade Log Export',
      description: 'Complete trade history for the last month',
      date: '2023-09-10',
      type: 'Trade Log',
      size: '3.8 MB'
    },
    {
      id: 'REP004',
      name: 'P&L Statement',
      description: 'Profit and loss breakdown by strategy',
      date: '2023-09-15',
      type: 'Financial',
      size: '1.5 MB'
    },
    {
      id: 'REP005',
      name: 'Sector Performance Analysis',
      description: 'Trading performance across different market sectors',
      date: '2023-09-20',
      type: 'Analysis',
      size: '2.1 MB'
    }
  ]);
  
  // Available report types for filtering
  const reportTypes = ['All', 'Summary', 'Strategy', 'Trade Log', 'Financial', 'Analysis'];
  const [selectedType, setSelectedType] = useState('All');
  
  // Available date ranges
  const dateRanges = [
    { value: 'last7', label: 'Last 7 days' },
    { value: 'last30', label: 'Last 30 days' },
    { value: 'last90', label: 'Last 90 days' },
    { value: 'custom', label: 'Custom range' }
  ];
  
  // Sort functionality
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };
  
  // Filter reports based on selected type
  const filteredReports = reports.filter(report => {
    return selectedType === 'All' || report.type === selectedType;
  });
  
  // Sort reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortBy === 'date') {
      return sortDirection === 'asc' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === 'name') {
      return sortDirection === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'type') {
      return sortDirection === 'asc'
        ? a.type.localeCompare(b.type)
        : b.type.localeCompare(a.type);
    }
    return 0;
  });

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (sortBy === field) {
      return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date Range
            </label>
            <select
              id="date-range"
              className="input mt-1"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              {dateRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <Filter className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Report Type
            </label>
            <select
              id="report-type"
              className="input mt-1"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {reportTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-head-cell">
                  <button 
                    className="flex items-center space-x-1"
                    onClick={() => toggleSort('name')}
                  >
                    <span>Report Name</span>
                    {renderSortIndicator('name')}
                  </button>
                </th>
                <th className="table-head-cell">Description</th>
                <th className="table-head-cell">
                  <button 
                    className="flex items-center space-x-1"
                    onClick={() => toggleSort('date')}
                  >
                    <span>Date</span>
                    {renderSortIndicator('date')}
                  </button>
                </th>
                <th className="table-head-cell">
                  <button 
                    className="flex items-center space-x-1"
                    onClick={() => toggleSort('type')}
                  >
                    <span>Type</span>
                    {renderSortIndicator('type')}
                  </button>
                </th>
                <th className="table-head-cell text-right">Size</th>
                <th className="table-head-cell text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {sortedReports.map((report) => (
                <tr key={report.id} className="table-row">
                  <td className="table-cell font-medium">{report.name}</td>
                  <td className="table-cell text-sm">{report.description}</td>
                  <td className="table-cell">
                    {new Date(report.date).toLocaleDateString()}
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      report.type === 'Summary' 
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                        : report.type === 'Strategy'
                          ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                          : report.type === 'Trade Log'
                            ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400'
                            : report.type === 'Financial'
                              ? 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-400'
                              : 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-400'
                    }`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="table-cell text-right">{report.size}</td>
                  <td className="table-cell text-right">
                    <button className="btn-secondary py-1 px-3 text-sm">
                      <Download className="h-4 w-4 mr-1 inline-block" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
              
              {sortedReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No reports found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;