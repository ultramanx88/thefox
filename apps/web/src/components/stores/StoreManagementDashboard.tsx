'use client';

import { useState } from 'react';
import { Store, MapPin, Clock, Users, TrendingUp, Settings, AlertTriangle } from 'lucide-react';
import { StoreManager } from '@/lib/stores/manager';

export default function StoreManagementDashboard() {
  const [storeManager] = useState(new StoreManager());
  const [stores] = useState(storeManager.getAllStores());
  const [selectedStore, setSelectedStore] = useState(stores[0]);
  const [analytics] = useState(storeManager.getStoreAnalytics());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'flagship': return 'bg-purple-100 text-purple-800';
      case 'branch': return 'bg-blue-100 text-blue-800';
      case 'franchise': return 'bg-green-100 text-green-800';
      case 'warehouse': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCapacityStatus = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return { color: 'text-red-600', status: 'Critical' };
    if (percentage >= 70) return { color: 'text-yellow-600', status: 'High' };
    return { color: 'text-green-600', status: 'Normal' };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Store Management Dashboard</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Add New Store
          </button>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Stores</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalStores}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Daily Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${analytics.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-bold">★</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageRating}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Stores</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.activeStores}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Store List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">All Stores</h2>
            
            <div className="space-y-3">
              {stores.map((store) => {
                const capacity = getCapacityStatus(store.capacity.currentOrders, store.capacity.maxOrders);
                return (
                  <div
                    key={store.id}
                    onClick={() => setSelectedStore(store)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedStore.id === store.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{store.name}</h3>
                        <p className="text-sm text-gray-600">{store.location.city}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(store.status)}`}>
                          {store.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(store.type)}`}>
                          {store.type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>Orders: {store.capacity.currentOrders}/{store.capacity.maxOrders}</div>
                      <div className={capacity.color}>Load: {capacity.status}</div>
                      <div>Staff: {store.capacity.staff}</div>
                      <div>Revenue: ${store.performance.dailyRevenue.toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Store Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedStore && (
              <>
                {/* Store Overview */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedStore.name}</h2>
                      <p className="text-gray-600">{selectedStore.location.address}</p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedStore.status)}`}>
                        {selectedStore.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm ${getTypeColor(selectedStore.type)}`}>
                        {selectedStore.type}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-medium">Location</span>
                      </div>
                      <p className="text-sm text-gray-600">{selectedStore.location.city}, {selectedStore.location.state}</p>
                      <p className="text-sm text-gray-600">Delivery: {selectedStore.capacity.deliveryRadius}km</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Users className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium">Capacity</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Orders: {selectedStore.capacity.currentOrders}/{selectedStore.capacity.maxOrders}
                      </p>
                      <p className="text-sm text-gray-600">Staff: {selectedStore.capacity.staff}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="font-medium">Performance</span>
                      </div>
                      <p className="text-sm text-gray-600">Revenue: ${selectedStore.performance.dailyRevenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Rating: {selectedStore.performance.averageRating}★</p>
                    </div>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Operating Hours
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedStore.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium capitalize">{day}</span>
                        <span className={hours.closed ? 'text-red-600' : 'text-gray-900'}>
                          {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inventory Status */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Inventory Status</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedStore.inventory.totalItems}</p>
                      <p className="text-sm text-blue-800">Total Items</p>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{selectedStore.inventory.lowStockItems}</p>
                      <p className="text-sm text-yellow-800">Low Stock</p>
                    </div>
                    
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{selectedStore.inventory.outOfStockItems}</p>
                      <p className="text-sm text-red-800">Out of Stock</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-4">
                    Last updated: {new Date(selectedStore.inventory.lastUpdated).toLocaleString()}
                  </p>
                </div>

                {/* Features & Services */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-green-600" />
                    Features & Services
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(selectedStore.features).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm capitalize">
                          {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Manager:</span>
                      <span className="font-medium">{selectedStore.contact.manager}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{selectedStore.contact.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedStore.contact.email}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}