'use client';

import { useState, useEffect } from 'react';
import { Thermometer, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface TemperatureReading {
  timestamp: string;
  zone: 'frozen' | 'fresh' | 'hot' | 'ambient';
  temperature: number;
  humidity: number;
  location: string;
  status: 'normal' | 'warning' | 'critical';
}

interface ColdChainAlert {
  id: string;
  type: 'temperature' | 'humidity' | 'door_open' | 'power_failure';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export default function ColdChainMonitoring() {
  const [readings, setReadings] = useState<TemperatureReading[]>([
    {
      timestamp: new Date().toISOString(),
      zone: 'frozen',
      temperature: -18,
      humidity: 85,
      location: 'Delivery Truck - Zone A',
      status: 'normal'
    },
    {
      timestamp: new Date().toISOString(),
      zone: 'fresh',
      temperature: 4,
      humidity: 90,
      location: 'Delivery Truck - Zone B',
      status: 'normal'
    },
    {
      timestamp: new Date().toISOString(),
      zone: 'hot',
      temperature: 65,
      humidity: 60,
      location: 'Delivery Truck - Zone C',
      status: 'normal'
    }
  ]);

  const [alerts, setAlerts] = useState<ColdChainAlert[]>([
    {
      id: '1',
      type: 'temperature',
      severity: 'medium',
      message: 'Fresh zone temperature rising above 6°C',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      resolved: false
    }
  ]);

  const getZoneConfig = (zone: string) => {
    switch (zone) {
      case 'frozen':
        return { 
          name: 'Frozen Zone', 
          target: -18, 
          min: -21, 
          max: -15, 
          color: 'blue',
          icon: '❄️'
        };
      case 'fresh':
        return { 
          name: 'Fresh Zone', 
          target: 4, 
          min: 2, 
          max: 6, 
          color: 'green',
          icon: '🥬'
        };
      case 'hot':
        return { 
          name: 'Hot Zone', 
          target: 65, 
          min: 60, 
          max: 75, 
          color: 'red',
          icon: '🔥'
        };
      default:
        return { 
          name: 'Ambient', 
          target: 20, 
          min: 18, 
          max: 25, 
          color: 'gray',
          icon: '🌡️'
        };
    }
  };

  const getTemperatureStatus = (temp: number, zone: string) => {
    const config = getZoneConfig(zone);
    if (temp < config.min || temp > config.max) return 'critical';
    if (temp < config.min + 1 || temp > config.max - 1) return 'warning';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setReadings(prev => prev.map(reading => ({
        ...reading,
        temperature: reading.temperature + (Math.random() - 0.5) * 2,
        humidity: Math.max(0, Math.min(100, reading.humidity + (Math.random() - 0.5) * 5)),
        timestamp: new Date().toISOString(),
        status: getTemperatureStatus(reading.temperature, reading.zone)
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Cold Chain Monitoring</h1>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">Live Monitoring Active</span>
          </div>
        </div>

        {/* Active Alerts */}
        {alerts.filter(alert => !alert.resolved).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-red-800 mb-3 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Active Alerts ({alerts.filter(alert => !alert.resolved).length})
            </h2>
            <div className="space-y-2">
              {alerts.filter(alert => !alert.resolved).map(alert => (
                <div key={alert.id} className="flex justify-between items-center bg-white p-3 rounded border">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-sm">{alert.message}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    onClick={() => setAlerts(prev => prev.map(a => 
                      a.id === alert.id ? { ...a, resolved: true } : a
                    ))}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Temperature Zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {readings.map((reading, index) => {
            const config = getZoneConfig(reading.zone);
            const trend = Math.random() > 0.5 ? 'up' : 'down';
            
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center">
                      <span className="mr-2">{config.icon}</span>
                      {config.name}
                    </h3>
                    <p className="text-sm text-gray-500">{reading.location}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reading.status)}`}>
                    {reading.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Temperature */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Temperature</span>
                      <div className="flex items-center">
                        {trend === 'up' ? 
                          <TrendingUp className="h-4 w-4 text-red-500 mr-1" /> :
                          <TrendingDown className="h-4 w-4 text-blue-500 mr-1" />
                        }
                        <span className="text-2xl font-bold">{reading.temperature.toFixed(1)}°C</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-${config.color}-600 h-2 rounded-full transition-all duration-300`}
                        style={{ 
                          width: `${Math.max(0, Math.min(100, 
                            ((reading.temperature - config.min) / (config.max - config.min)) * 100
                          ))}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{config.min}°C</span>
                      <span>Target: {config.target}°C</span>
                      <span>{config.max}°C</span>
                    </div>
                  </div>

                  {/* Humidity */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Humidity</span>
                      <span className="font-semibold">{reading.humidity.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full"
                        style={{ width: `${reading.humidity}%` }}
                      />
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="text-xs text-gray-500 flex items-center">
                    <Thermometer className="h-3 w-3 mr-1" />
                    Last updated: {new Date(reading.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Food Safety Guidelines */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Food Safety Temperature Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">❄️ Frozen Foods</h3>
              <p className="text-sm text-gray-600 mb-2">Target: -18°C or below</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Ice cream, frozen vegetables</li>
                <li>• Frozen meat, seafood</li>
                <li>• Max deviation: ±3°C</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">🥬 Fresh/Chilled</h3>
              <p className="text-sm text-gray-600 mb-2">Target: 2-6°C</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Dairy products, fresh meat</li>
                <li>• Fruits, vegetables</li>
                <li>• Critical for safety</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-2">🔥 Hot Foods</h3>
              <p className="text-sm text-gray-600 mb-2">Target: >60°C</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Prepared hot meals</li>
                <li>• Cooked foods</li>
                <li>• Prevent bacterial growth</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">🌡️ Dry Goods</h3>
              <p className="text-sm text-gray-600 mb-2">Target: 18-25°C</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Canned goods, grains</li>
                <li>• Packaged snacks</li>
                <li>• Room temperature stable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}