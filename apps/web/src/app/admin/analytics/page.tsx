'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  salesData: Array<{ date: string; sales: number; orders: number }>;
  topProducts: Array<{ name: string; sales: number; quantity: number }>;
  customerMetrics: {
    newCustomers: number;
    returningCustomers: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    monthlyGrowth: number;
    dailyAverage: number;
  };
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    // Mock analytics data
    const mockAnalytics: AnalyticsData = {
      salesData: [
        { date: '2024-01-01', sales: 1200, orders: 15 },
        { date: '2024-01-02', sales: 1800, orders: 22 },
        { date: '2024-01-03', sales: 950, orders: 12 },
        { date: '2024-01-04', sales: 2100, orders: 28 },
        { date: '2024-01-05', sales: 1650, orders: 19 },
        { date: '2024-01-06', sales: 2300, orders: 31 },
        { date: '2024-01-07', sales: 1900, orders: 24 }
      ],
      topProducts: [
        { name: 'Organic Bananas', sales: 5600, quantity: 234 },
        { name: 'Fresh Strawberries', sales: 4200, quantity: 156 },
        { name: 'Organic Milk', sales: 3800, quantity: 189 },
        { name: 'Whole Grain Bread', sales: 2900, quantity: 98 },
        { name: 'Free Range Eggs', sales: 2400, quantity: 87 }
      ],
      customerMetrics: {
        newCustomers: 145,
        returningCustomers: 89,
        averageOrderValue: 67.50,
        conversionRate: 3.2
      },
      revenueMetrics: {
        totalRevenue: 89650,
        monthlyGrowth: 12.5,
        dailyAverage: 2895
      }
    };

    setAnalytics(mockAnalytics);
  }, [timeRange]);

  if (!analytics) {
    return <div className="flex justify-center items-center h-screen">Loading analytics...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-600">${analytics.revenueMetrics.totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-green-600">+{analytics.revenueMetrics.monthlyGrowth}% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Daily Average</h3>
          <p className="text-2xl font-bold text-gray-900">${analytics.revenueMetrics.dailyAverage.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
          <p className="text-2xl font-bold text-gray-900">${analytics.customerMetrics.averageOrderValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Sales Overview</h2>
        <div className="h-64 flex items-end space-x-2">
          {analytics.salesData.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="bg-blue-500 w-full rounded-t"
                style={{ height: `${(day.sales / 2500) * 100}%` }}
              />
              <span className="text-xs text-gray-500 mt-2">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-xs font-medium">${day.sales}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Products</h2>
          <div className="space-y-3">
            {analytics.topProducts.map((product, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.quantity} sold</p>
                </div>
                <p className="font-semibold text-green-600">${product.sales.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Metrics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Insights</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">New Customers</span>
              <span className="font-semibold">{analytics.customerMetrics.newCustomers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Returning Customers</span>
              <span className="font-semibold">{analytics.customerMetrics.returningCustomers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-semibold">{analytics.customerMetrics.conversionRate}%</span>
            </div>
            
            {/* Customer Distribution Chart */}
            <div className="mt-4">
              <div className="flex h-4 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500"
                  style={{ 
                    width: `${(analytics.customerMetrics.newCustomers / (analytics.customerMetrics.newCustomers + analytics.customerMetrics.returningCustomers)) * 100}%` 
                  }}
                />
                <div 
                  className="bg-green-500"
                  style={{ 
                    width: `${(analytics.customerMetrics.returningCustomers / (analytics.customerMetrics.newCustomers + analytics.customerMetrics.returningCustomers)) * 100}%` 
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>New</span>
                <span>Returning</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}