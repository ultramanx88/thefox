'use client';

import { useState, useEffect } from 'react';
import { LogManager, PerformanceLogger } from '@/lib/logging/log-manager';

export default function LogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [filter, setFilter] = useState({
    level: [] as string[],
    category: [] as string[],
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    loadLogs();
    loadStats();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadLogs();
      loadStats();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [filter]);

  const loadLogs = () => {
    const filterObj = {
      level: filter.level.length > 0 ? filter.level : undefined,
      category: filter.category.length > 0 ? filter.category : undefined,
      search: filter.search || undefined,
      dateFrom: filter.dateFrom ? new Date(filter.dateFrom) : undefined,
      dateTo: filter.dateTo ? new Date(filter.dateTo) : undefined
    };
    
    const filteredLogs = LogManager.getLogs(filterObj);
    setLogs(filteredLogs.slice(0, 1000)); // Limit display
  };

  const loadStats = () => {
    const logStats = LogManager.getLogStats();
    setStats(logStats);
  };

  const handleLevelFilter = (level: string) => {
    setFilter(prev => ({
      ...prev,
      level: prev.level.includes(level) 
        ? prev.level.filter(l => l !== level)
        : [...prev.level, level]
    }));
  };

  const handleCategoryFilter = (category: string) => {
    setFilter(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category]
    }));
  };

  const exportLogs = (format: 'json' | 'csv') => {
    const data = LogManager.exportLogs(format);
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllLogs = () => {
    if (confirm('คุณต้องการลบ log ทั้งหมดหรือไม่?')) {
      LogManager.clearLogs();
      loadLogs();
      loadStats();
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debug': return 'text-gray-600 bg-gray-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warn': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'critical': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const testLogs = () => {
    LogManager.debug('test', 'This is a debug message');
    LogManager.info('test', 'This is an info message');
    LogManager.warn('test', 'This is a warning message');
    LogManager.error('test', 'This is an error message');
    LogManager.critical('test', 'This is a critical message');
    
    PerformanceLogger.startTimer('test-operation');
    setTimeout(() => {
      PerformanceLogger.endTimer('test-operation');
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ระบบจัดเก็บ Log</h1>
        <p className="text-gray-600">ตรวจสอบและจัดการ log ของระบบ</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Log ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">24 ชั่วโมงล่าสุด</p>
              <p className="text-2xl font-bold text-blue-600">{stats.last24h || 0}</p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Errors</p>
              <p className="text-2xl font-bold text-red-600">{stats.errors || 0}</p>
            </div>
            <div className="text-3xl">🚨</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Categories</p>
              <p className="text-2xl font-bold text-purple-600">
                {Object.keys(stats.categories || {}).length}
              </p>
            </div>
            <div className="text-3xl">📂</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Status</p>
              <p className="text-lg font-semibold text-green-600">🟢 Active</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            {/* Level Filters */}
            <div className="flex gap-2">
              {['debug', 'info', 'warn', 'error', 'critical'].map(level => (
                <button
                  key={level}
                  onClick={() => handleLevelFilter(level)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter.level.includes(level) 
                      ? getLevelColor(level)
                      : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="ค้นหา log..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm"
            />

            {/* Date Range */}
            <input
              type="datetime-local"
              value={filter.dateFrom}
              onChange={(e) => setFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="datetime-local"
              value={filter.dateTo}
              onChange={(e) => setFilter(prev => ({ ...prev, dateTo: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={testLogs}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              Test Logs
            </button>
            <button
              onClick={() => exportLogs('json')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
            >
              Export JSON
            </button>
            <button
              onClick={() => exportLogs('csv')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={clearAllLogs}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.timestamp).toLocaleString('th-TH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                    {log.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-600">ไม่พบ log ที่ตรงกับเงื่อนไข</p>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900">{new Date(selectedLog.timestamp).toLocaleString('th-TH')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Level</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(selectedLog.level)}`}>
                    {selectedLog.level.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="text-sm text-gray-900">{selectedLog.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Session ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedLog.sessionId}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedLog.message}</p>
              </div>
              
              {selectedLog.metadata && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Metadata</label>
                  <pre className="text-xs text-gray-900 bg-gray-50 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.stack && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stack Trace</label>
                  <pre className="text-xs text-gray-900 bg-red-50 p-3 rounded overflow-x-auto">
                    {selectedLog.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}