'use client';

import { useState, useEffect } from 'react';
import { Calculator, MapPin, Clock, Thermometer, Fuel, CloudRain } from 'lucide-react';
import { ShippingCalculator } from '@/lib/shipping/calculator';

export default function ShippingCalculatorComponent() {
  const [calculator] = useState(new ShippingCalculator());
  const [params, setParams] = useState({
    distance: 5.2,
    weight: 2.5,
    orderValue: 45.50,
    foodCategories: ['fresh', 'dry'],
    timeSlot: 'standard',
    isUrgent: false,
    weatherCondition: 'normal' as 'normal' | 'rain' | 'snow' | 'storm',
    fuelPrice: 1.65
  });
  
  const [calculation, setCalculation] = useState(calculator.calculateShipping(params));
  const [address, setAddress] = useState('');

  useEffect(() => {
    const newCalculation = calculator.calculateShipping(params);
    setCalculation(newCalculation);
  }, [params, calculator]);

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const toggleFoodCategory = (categoryId: string) => {
    setParams(prev => ({
      ...prev,
      foodCategories: prev.foodCategories.includes(categoryId)
        ? prev.foodCategories.filter(id => id !== categoryId)
        : [...prev.foodCategories, categoryId]
    }));
  };

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'rain': return '🌧️';
      case 'snow': return '❄️';
      case 'storm': return '⛈️';
      default: return '☀️';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center mb-6">
        <Calculator className="h-6 w-6 mr-2 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Smart Shipping Calculator</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Parameters */}
        <div className="space-y-6">
          {/* Delivery Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Delivery Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter delivery address"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <div className="mt-2 flex items-center space-x-4">
              <span className="text-sm text-gray-600">Distance:</span>
              <input
                type="range"
                min="0.5"
                max="30"
                step="0.1"
                value={params.distance}
                onChange={(e) => updateParam('distance', parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium">{params.distance.toFixed(1)} km</span>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order Value</label>
              <input
                type="number"
                value={params.orderValue}
                onChange={(e) => updateParam('orderValue', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
              <input
                type="number"
                value={params.weight}
                onChange={(e) => updateParam('weight', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
                step="0.1"
              />
            </div>
          </div>

          {/* Food Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Thermometer className="h-4 w-4 inline mr-1" />
              Food Categories
            </label>
            <div className="grid grid-cols-2 gap-2">
              {calculator.getFoodCategories().map(category => (
                <label key={category.id} className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={params.foodCategories.includes(category.id)}
                    onChange={() => toggleFoodCategory(category.id)}
                  />
                  <span className="text-sm">{category.name}</span>
                  {category.temperatureControl && <Thermometer className="h-3 w-3 text-blue-500" />}
                </label>
              ))}
            </div>
          </div>

          {/* Delivery Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Delivery Time
            </label>
            <select
              value={params.timeSlot}
              onChange={(e) => updateParam('timeSlot', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {calculator.getAvailableTimeSlots().map(slot => (
                <option key={slot.id} value={slot.id}>
                  {slot.name} {slot.multiplier !== 1.0 && `(+${((slot.multiplier - 1) * 100).toFixed(0)}%)`}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={params.isUrgent}
                onChange={(e) => updateParam('isUrgent', e.target.checked)}
              />
              <span className="text-sm">Priority/Urgent Delivery (+$5.00)</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CloudRain className="h-4 w-4 inline mr-1" />
                Weather Conditions
              </label>
              <select
                value={params.weatherCondition}
                onChange={(e) => updateParam('weatherCondition', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="normal">☀️ Normal Weather</option>
                <option value="rain">🌧️ Rainy (+$1.50)</option>
                <option value="snow">❄️ Snow (+$3.00)</option>
                <option value="storm">⛈️ Storm (+$5.00)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Fuel className="h-4 w-4 inline mr-1" />
                Current Fuel Price ($/L)
              </label>
              <input
                type="number"
                value={params.fuelPrice}
                onChange={(e) => updateParam('fuelPrice', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
                step="0.01"
                min="1.0"
                max="3.0"
              />
            </div>
          </div>
        </div>

        {/* Calculation Results */}
        <div className="space-y-6">
          {/* Total Cost */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Shipping Cost</h2>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                ${calculation.total.toFixed(2)}
              </div>
              {params.orderValue >= 75 && calculation.total === 0 && (
                <p className="text-green-600 font-medium">🎉 Free Shipping Applied!</p>
              )}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Cost Breakdown</h3>
            <div className="space-y-2">
              {calculation.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">{item.label}</span>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  <span className={`font-medium ${item.amount < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {item.amount < 0 ? '-' : ''}${Math.abs(item.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Zones */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Delivery Zones</h3>
            <div className="space-y-2">
              {calculator.getShippingZones().map(zone => (
                <div 
                  key={zone.id} 
                  className={`p-2 rounded text-sm ${
                    params.distance <= zone.maxDistance ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{zone.name}</span>
                    <span>Up to {zone.maxDistance} km</span>
                  </div>
                  <div className="text-xs">
                    Base: ${zone.baseRate} + ${zone.perKmRate}/km
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Free Shipping Info */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">💡 Free Shipping</h3>
            <p className="text-sm text-green-800">
              Orders over $75 qualify for free delivery! 
              {params.orderValue < 75 && (
                <span className="font-medium">
                  {' '}Add ${(75 - params.orderValue).toFixed(2)} more to qualify.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}