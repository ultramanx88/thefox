'use client';

import { useState } from 'react';
import PrecisionNavigation from '@/components/navigation/PrecisionNavigation';
import AIRouteOptimizer from '@/components/navigation/AIRouteOptimizer';
import { Navigation, Route, MapPin } from 'lucide-react';

export default function NavigationPage() {
  const [activeTab, setActiveTab] = useState<'precision' | 'optimizer' | 'live'>('precision');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Advanced Navigation System</h1>
            
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('precision')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeTab === 'precision'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Navigation className="h-5 w-5" />
                <span>Precision GPS</span>
              </button>
              
              <button
                onClick={() => setActiveTab('optimizer')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeTab === 'optimizer'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Route className="h-5 w-5" />
                <span>Route Optimizer</span>
              </button>
              
              <button
                onClick={() => setActiveTab('live')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeTab === 'live'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapPin className="h-5 w-5" />
                <span>Live Tracking</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'precision' && <PrecisionNavigation />}
        {activeTab === 'optimizer' && <AIRouteOptimizer />}
        {activeTab === 'live' && (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Live Tracking Dashboard</h2>
              <p className="text-gray-600 mb-6">
                Real-time tracking with live updates and fleet management.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Active Vehicles</h3>
                  <p className="text-3xl font-bold text-blue-600">12</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Completed Today</h3>
                  <p className="text-3xl font-bold text-green-600">89</p>
                </div>
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">Average ETA</h3>
                  <p className="text-3xl font-bold text-yellow-600">18min</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}