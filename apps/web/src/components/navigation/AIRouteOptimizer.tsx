'use client';

import { useState, useEffect } from 'react';
import { Route, Clock, Fuel, TrendingUp, MapPin, Zap } from 'lucide-react';

interface DeliveryStop {
  id: string;
  address: string;
  coordinates: { lat: number; lng: number };
  priority: 'urgent' | 'high' | 'normal' | 'low';
  timeWindow: { start: string; end: string };
  serviceTime: number; // minutes
  specialRequirements?: string[];
}

interface OptimizedRoute {
  id: string;
  stops: DeliveryStop[];
  totalDistance: number;
  totalTime: number;
  fuelConsumption: number;
  efficiency: number;
  trafficFactor: number;
}

interface RouteMetrics {
  originalDistance: number;
  optimizedDistance: number;
  timeSaved: number;
  fuelSaved: number;
  co2Reduced: number;
}

export default function AIRouteOptimizer() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationLevel, setOptimizationLevel] = useState<'basic' | 'advanced' | 'ai'>('ai');
  const [currentRoute, setCurrentRoute] = useState<OptimizedRoute | null>(null);
  const [metrics, setMetrics] = useState<RouteMetrics | null>(null);

  const [deliveryStops] = useState<DeliveryStop[]>([
    {
      id: '1',
      address: '123 Main St, Boston, MA',
      coordinates: { lat: 42.3601, lng: -71.0589 },
      priority: 'urgent',
      timeWindow: { start: '09:00', end: '11:00' },
      serviceTime: 5,
      specialRequirements: ['frozen_goods', 'signature_required']
    },
    {
      id: '2',
      address: '456 Oak Ave, Cambridge, MA',
      coordinates: { lat: 42.3736, lng: -71.1097 },
      priority: 'high',
      timeWindow: { start: '10:00', end: '14:00' },
      serviceTime: 3
    },
    {
      id: '3',
      address: '789 Pine St, Somerville, MA',
      coordinates: { lat: 42.3875, lng: -71.0995 },
      priority: 'normal',
      timeWindow: { start: '12:00', end: '16:00' },
      serviceTime: 4,
      specialRequirements: ['fragile_items']
    },
    {
      id: '4',
      address: '321 Elm Dr, Brookline, MA',
      coordinates: { lat: 42.3317, lng: -71.1211 },
      priority: 'normal',
      timeWindow: { start: '13:00', end: '17:00' },
      serviceTime: 6
    },
    {
      id: '5',
      address: '654 Maple Rd, Newton, MA',
      coordinates: { lat: 42.3370, lng: -71.2092 },
      priority: 'low',
      timeWindow: { start: '14:00', end: '18:00' },
      serviceTime: 3
    }
  ]);

  const optimizeRoute = async () => {
    setIsOptimizing(true);
    
    // Simulate AI optimization process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock optimized route calculation
    const optimizedStops = [...deliveryStops].sort((a, b) => {
      // Priority-based sorting with time window consideration
      const priorityWeight = { urgent: 4, high: 3, normal: 2, low: 1 };
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      // Sort by time window start if same priority
      return a.timeWindow.start.localeCompare(b.timeWindow.start);
    });

    const route: OptimizedRoute = {
      id: 'route_' + Date.now(),
      stops: optimizedStops,
      totalDistance: 45.2,
      totalTime: 180, // minutes
      fuelConsumption: 8.5, // liters
      efficiency: 94, // percentage
      trafficFactor: 1.15
    };

    const routeMetrics: RouteMetrics = {
      originalDistance: 62.8,
      optimizedDistance: 45.2,
      timeSaved: 45,
      fuelSaved: 3.2,
      co2Reduced: 7.6
    };

    setCurrentRoute(route);
    setMetrics(routeMetrics);
    setIsOptimizing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOptimizationDescription = (level: string) => {
    switch (level) {
      case 'basic': return 'Distance-based optimization';
      case 'advanced': return 'Multi-factor optimization (distance, time, traffic)';
      case 'ai': return 'AI-powered optimization with machine learning';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Route className="h-6 w-6 mr-2 text-blue-600" />
            AI Route Optimizer
          </h1>
          
          <div className="flex items-center space-x-4">
            <select
              value={optimizationLevel}
              onChange={(e) => setOptimizationLevel(e.target.value as any)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="basic">Basic Optimization</option>
              <option value="advanced">Advanced Optimization</option>
              <option value="ai">AI Optimization</option>
            </select>
            
            <button
              onClick={optimizeRoute}
              disabled={isOptimizing}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isOptimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize Route
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Optimization Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Optimization Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optimization Level
                </label>
                <p className="text-sm text-gray-600">{getOptimizationDescription(optimizationLevel)}</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Optimization Factors</h3>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm">Minimize total distance</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm">Respect time windows</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm">Consider traffic patterns</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm">Prioritize urgent deliveries</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="mr-2" />
                    <span className="text-sm">Minimize fuel consumption</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Avoid toll roads</span>
                  </label>
                </div>
              </div>

              {optimizationLevel === 'ai' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">AI Features</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Real-time traffic prediction</li>
                    <li>• Weather impact analysis</li>
                    <li>• Historical delivery patterns</li>
                    <li>• Customer preference learning</li>
                    <li>• Dynamic re-optimization</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Route Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Metrics */}
            {metrics && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Optimization Results
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Route className="h-5 w-5 text-green-600" />
                      <span className="text-green-600 font-bold">-28%</span>
                    </div>
                    <p className="text-sm text-gray-600">Distance Saved</p>
                    <p className="font-bold">{(metrics.originalDistance - metrics.optimizedDistance).toFixed(1)} km</p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-600 font-bold">-{metrics.timeSaved}min</span>
                    </div>
                    <p className="text-sm text-gray-600">Time Saved</p>
                    <p className="font-bold">{Math.floor(metrics.timeSaved / 60)}h {metrics.timeSaved % 60}m</p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Fuel className="h-5 w-5 text-yellow-600" />
                      <span className="text-yellow-600 font-bold">-{metrics.fuelSaved}L</span>
                    </div>
                    <p className="text-sm text-gray-600">Fuel Saved</p>
                    <p className="font-bold">${(metrics.fuelSaved * 1.5).toFixed(2)}</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-600">🌱</span>
                      <span className="text-purple-600 font-bold">-{metrics.co2Reduced}kg</span>
                    </div>
                    <p className="text-sm text-gray-600">CO₂ Reduced</p>
                    <p className="font-bold">Carbon Savings</p>
                  </div>
                </div>
              </div>
            )}

            {/* Optimized Route */}
            {currentRoute && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Optimized Route</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Total: {currentRoute.totalDistance} km</span>
                    <span>Time: {Math.floor(currentRoute.totalTime / 60)}h {currentRoute.totalTime % 60}m</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      {currentRoute.efficiency}% efficient
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {currentRoute.stops.map((stop, index) => (
                    <div key={stop.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">{stop.address}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(stop.priority)}`}>
                            {stop.priority}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {stop.timeWindow.start} - {stop.timeWindow.end}
                          </span>
                          <span>Service: {stop.serviceTime}min</span>
                          {stop.specialRequirements && (
                            <span className="text-orange-600">
                              ⚠️ {stop.specialRequirements.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                          Navigate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex space-x-3">
                  <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                    Start Route
                  </button>
                  <button className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">
                    Export to GPS
                  </button>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Share Route
                  </button>
                </div>
              </div>
            )}

            {/* Original Stops (if no optimization yet) */}
            {!currentRoute && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Delivery Stops ({deliveryStops.length})</h2>
                <p className="text-gray-600 mb-4">Click "Optimize Route" to get the most efficient delivery sequence.</p>
                
                <div className="space-y-3">
                  {deliveryStops.map((stop, index) => (
                    <div key={stop.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">{stop.address}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(stop.priority)}`}>
                            {stop.priority}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {stop.timeWindow.start} - {stop.timeWindow.end} • {stop.serviceTime}min service
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}