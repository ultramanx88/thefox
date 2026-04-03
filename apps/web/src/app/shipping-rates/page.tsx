'use client';

import ShippingCalculator from '@/components/shipping/ShippingCalculator';
import { Truck, Clock, Shield, Thermometer } from 'lucide-react';

export default function ShippingRatesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping Rates & Calculator</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Calculate precise shipping costs for your food delivery with our smart pricing system.
          </p>
        </div>

        <div className="mb-12">
          <ShippingCalculator />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <Truck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Smart Routing</h3>
            <p className="text-sm text-gray-600">AI-optimized delivery routes</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <Thermometer className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Temperature Control</h3>
            <p className="text-sm text-gray-600">Specialized food handling</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Flexible Timing</h3>
            <p className="text-sm text-gray-600">Multiple delivery options</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Safe Delivery</h3>
            <p className="text-sm text-gray-600">Food safety protocols</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing Structure</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Base Rates</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>City Center (0-5 km)</span>
                  <span className="font-medium">$3.99 + $0.50/km</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Suburbs (5-15 km)</span>
                  <span className="font-medium">$5.99 + $0.75/km</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Extended (15-30 km)</span>
                  <span className="font-medium">$8.99 + $1.00/km</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Fees</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Frozen Foods</span>
                  <span className="font-medium">+$2.00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Fresh/Chilled</span>
                  <span className="font-medium">+$1.50</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Express (1-2h)</span>
                  <span className="font-medium">+50%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>Rush (30-60min)</span>
                  <span className="font-medium">+100%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">🎉 Free Shipping</h3>
            <p className="text-green-800">Free delivery on orders over $75</p>
          </div>
        </div>
      </div>
    </div>
  );
}