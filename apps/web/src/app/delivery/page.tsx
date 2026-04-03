'use client';

import { useState } from 'react';
import { Thermometer, Clock, Truck, AlertTriangle, CheckCircle } from 'lucide-react';

interface DeliveryOrder {
  id: string;
  customerName: string;
  address: string;
  items: Array<{
    name: string;
    category: 'frozen' | 'fresh' | 'dry' | 'hot';
    temperature: number;
    quantity: number;
  }>;
  specialInstructions: string;
  deliveryWindow: string;
  status: 'preparing' | 'ready' | 'picked_up' | 'in_transit' | 'delivered';
  temperatureLog: Array<{
    timestamp: string;
    temperature: number;
    location: string;
  }>;
}

export default function FoodDeliverySystem() {
  const [orders] = useState<DeliveryOrder[]>([
    {
      id: 'FD001',
      customerName: 'John Doe',
      address: '123 Main St, Boston, MA',
      items: [
        { name: 'Frozen Vegetables', category: 'frozen', temperature: -18, quantity: 2 },
        { name: 'Fresh Milk', category: 'fresh', temperature: 4, quantity: 1 },
        { name: 'Hot Soup', category: 'hot', temperature: 65, quantity: 1 }
      ],
      specialInstructions: 'Keep frozen items separate. Deliver to back door.',
      deliveryWindow: '2:00 PM - 4:00 PM',
      status: 'in_transit',
      temperatureLog: [
        { timestamp: '2024-01-18T14:00:00Z', temperature: -15, location: 'Warehouse' },
        { timestamp: '2024-01-18T14:30:00Z', temperature: -16, location: 'Delivery Truck' },
        { timestamp: '2024-01-18T15:00:00Z', temperature: -14, location: 'En Route' }
      ]
    }
  ]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'frozen': return 'bg-blue-100 text-blue-800';
      case 'fresh': return 'bg-green-100 text-green-800';
      case 'hot': return 'bg-red-100 text-red-800';
      case 'dry': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTemperatureStatus = (current: number, required: number, category: string) => {
    const tolerance = category === 'frozen' ? 3 : category === 'fresh' ? 2 : 5;
    const diff = Math.abs(current - required);
    
    if (diff <= tolerance) return 'safe';
    if (diff <= tolerance * 2) return 'warning';
    return 'danger';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Food Delivery Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Temperature Monitoring */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Thermometer className="h-5 w-5 mr-2 text-blue-600" />
              Temperature Control
            </h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Frozen Zone</span>
                  <span className="text-2xl font-bold text-blue-600">-16°C</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }} />
                </div>
                <p className="text-xs text-blue-700 mt-1">Target: -18°C ± 3°C</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Fresh Zone</span>
                  <span className="text-2xl font-bold text-green-600">4°C</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }} />
                </div>
                <p className="text-xs text-green-700 mt-1">Target: 2-6°C</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Hot Zone</span>
                  <span className="text-2xl font-bold text-red-600">63°C</span>
                </div>
                <div className="w-full bg-red-200 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: '95%' }} />
                </div>
                <p className="text-xs text-red-700 mt-1">Target: >60°C</p>
              </div>
            </div>
          </div>

          {/* Active Orders */}
          <div className="lg:col-span-2 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                    <p className="text-gray-600">{order.customerName}</p>
                    <p className="text-sm text-gray-500">{order.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {order.deliveryWindow}
                    </p>
                  </div>
                </div>

                {/* Items with Temperature Requirements */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Items & Temperature Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {order.items.map((item, index) => {
                      const currentTemp = order.temperatureLog[order.temperatureLog.length - 1]?.temperature || item.temperature;
                      const status = getTemperatureStatus(currentTemp, item.temperature, item.category);
                      
                      return (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(item.category)}`}>
                                {item.category}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center">
                                {status === 'safe' && <CheckCircle className="h-4 w-4 text-green-600 mr-1" />}
                                {status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600 mr-1" />}
                                {status === 'danger' && <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />}
                                <span className={`font-bold ${
                                  status === 'safe' ? 'text-green-600' :
                                  status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {currentTemp}°C
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">Target: {item.temperature}°C</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Special Instructions */}
                {order.specialInstructions && (
                  <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                    <h5 className="font-medium text-yellow-800 mb-1">Special Instructions:</h5>
                    <p className="text-yellow-700 text-sm">{order.specialInstructions}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
                    <Truck className="h-4 w-4 mr-2" />
                    Update Status
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    View Route
                  </button>
                  <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                    Contact Customer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Food Safety Alerts */}
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Food Safety Alerts
          </h3>
          <div className="space-y-2 text-sm text-red-700">
            <p>• Frozen items must maintain -18°C ± 3°C throughout delivery</p>
            <p>• Fresh dairy products require 2-6°C temperature range</p>
            <p>• Hot food items must stay above 60°C to prevent bacterial growth</p>
            <p>• Maximum delivery time for perishables: 2 hours from pickup</p>
          </div>
        </div>
      </div>
    </div>
  );
}