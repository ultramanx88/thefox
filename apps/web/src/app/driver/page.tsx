'use client';

import { useState, useEffect } from 'react';
import { Navigation, MapPin, Clock, Phone, Camera, CheckCircle } from 'lucide-react';

interface DriverOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  coordinates: { lat: number; lng: number };
  items: Array<{ name: string; quantity: number; special?: string }>;
  deliveryWindow: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered';
  estimatedTime: number; // minutes
  specialInstructions?: string;
}

export default function DriverDashboard() {
  const [currentLocation, setCurrentLocation] = useState({ lat: 42.3601, lng: -71.0589 });
  const [isOnline, setIsOnline] = useState(true);
  const [orders, setOrders] = useState<DriverOrder[]>([
    {
      id: 'ORD001',
      customerName: 'Sarah Johnson',
      customerPhone: '+1-555-0123',
      address: '456 Oak Street, Boston, MA 02101',
      coordinates: { lat: 42.3584, lng: -71.0598 },
      items: [
        { name: 'Organic Milk', quantity: 2 },
        { name: 'Fresh Bread', quantity: 1, special: 'Keep upright' }
      ],
      deliveryWindow: '2:00 PM - 3:00 PM',
      priority: 'high',
      status: 'picked_up',
      estimatedTime: 12,
      specialInstructions: 'Ring doorbell twice. Leave at door if no answer.'
    },
    {
      id: 'ORD002',
      customerName: 'Mike Chen',
      customerPhone: '+1-555-0124',
      address: '789 Pine Avenue, Boston, MA 02102',
      coordinates: { lat: 42.3505, lng: -71.0495 },
      items: [
        { name: 'Frozen Pizza', quantity: 3 },
        { name: 'Ice Cream', quantity: 2, special: 'Keep frozen' }
      ],
      deliveryWindow: '3:00 PM - 4:00 PM',
      priority: 'medium',
      status: 'pending',
      estimatedTime: 25
    }
  ]);

  const updateOrderStatus = (orderId: string, newStatus: DriverOrder['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'picked_up': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Driver Status Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">Driver Status: {isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-4 py-2 rounded-lg ${
                isOnline ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Today's Deliveries</p>
              <p className="font-bold text-lg">12 / 15</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Earnings</p>
              <p className="font-bold text-lg text-green-600">$156.50</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Route Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Navigation className="h-5 w-5 mr-2 text-blue-600" />
              Today's Route
            </h2>
            
            <div className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium">Total Distance</p>
                <p className="text-2xl font-bold text-blue-600">24.5 km</p>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-medium">Estimated Time</p>
                <p className="text-2xl font-bold text-green-600">2h 15m</p>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="font-medium">Remaining Stops</p>
                <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status !== 'delivered').length}</p>
              </div>
            </div>

            <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center">
              <Navigation className="h-4 w-4 mr-2" />
              Start Navigation
            </button>
          </div>

          {/* Active Orders */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">Active Deliveries</h2>
            
            {orders.map((order) => (
              <div key={order.id} className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                order.priority === 'high' ? 'border-red-500' :
                order.priority === 'medium' ? 'border-yellow-500' : 'border-green-500'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold">#{order.id}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(order.priority)}`}>
                        {order.priority} priority
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {order.address}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {order.deliveryWindow}
                    </p>
                    <p className="text-sm font-medium text-blue-600">ETA: {order.estimatedTime}min</p>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Items ({order.items.length})</h4>
                  <div className="space-y-1">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        {item.special && (
                          <span className="text-orange-600 font-medium">{item.special}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Instructions */}
                {order.specialInstructions && (
                  <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Instructions:</strong> {order.specialInstructions}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => window.open(`tel:${order.customerPhone}`)}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center text-sm"
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </button>
                  
                  <button
                    onClick={() => window.open(`https://maps.google.com/?q=${order.coordinates.lat},${order.coordinates.lng}`)}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Navigate
                  </button>

                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'picked_up')}
                      className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 text-sm"
                    >
                      Mark Picked Up
                    </button>
                  )}

                  {order.status === 'picked_up' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'in_transit')}
                      className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 text-sm"
                    >
                      Start Delivery
                    </button>
                  )}

                  {order.status === 'in_transit' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center text-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Delivered
                    </button>
                  )}

                  <button className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 flex items-center text-sm">
                    <Camera className="h-4 w-4 mr-1" />
                    Photo Proof
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2">Emergency Contacts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium">Dispatch Center</p>
              <p className="text-red-700">+1-555-DISPATCH</p>
            </div>
            <div>
              <p className="font-medium">Food Safety Hotline</p>
              <p className="text-red-700">+1-555-FOODSAFE</p>
            </div>
            <div>
              <p className="font-medium">Technical Support</p>
              <p className="text-red-700">+1-555-TECHHELP</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}