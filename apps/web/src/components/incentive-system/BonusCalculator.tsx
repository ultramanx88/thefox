'use client';

import { useState, useEffect } from 'react';
import { IncentiveManager } from '@/lib/incentive-manager';

export default function BonusCalculator() {
  const [orderDetails, setOrderDetails] = useState({
    baseAmount: 45,
    distance: 3.2,
    rating: 5,
    weather: 'clear',
    hour: new Date().getHours()
  });

  const [calculatedBonuses, setCalculatedBonuses] = useState({
    peakHour: 0,
    weather: 0,
    distance: 0,
    rating: 0,
    total: 0
  });

  useEffect(() => {
    const peakHour = IncentiveManager.calculatePeakHourBonus(orderDetails.hour, orderDetails.baseAmount);
    const weather = IncentiveManager.calculateWeatherBonus(orderDetails.weather, orderDetails.baseAmount);
    const distance = orderDetails.distance > 5 ? orderDetails.distance * 2 : 0;
    const rating = orderDetails.rating >= 5 ? 20 : 0;
    
    const total = peakHour + weather + distance + rating;
    
    setCalculatedBonuses({ peakHour, weather, distance, rating, total });
  }, [orderDetails]);

  const weatherOptions = [
    { value: 'clear', label: 'อากาศดี', multiplier: 1 },
    { value: 'rain', label: 'ฝนตก', multiplier: 1.3 },
    { value: 'heavy_rain', label: 'ฝนหนัก', multiplier: 1.4 },
    { value: 'storm', label: 'พายุ', multiplier: 1.5 }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">คำนวณโบนัส</h1>
        <p className="text-gray-600">ดูโบนัสที่คุณจะได้รับจากออเดอร์</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6">รายละเอียดออเดอร์</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ค่าส่งพื้นฐาน (บาท)</label>
              <input
                type="number"
                value={orderDetails.baseAmount}
                onChange={(e) => setOrderDetails({...orderDetails, baseAmount: parseFloat(e.target.value) || 0})}
                className="w-full border rounded-lg px-3 py-2"
                min="0"
                step="0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ระยะทาง (กิโลเมตร)</label>
              <input
                type="number"
                value={orderDetails.distance}
                onChange={(e) => setOrderDetails({...orderDetails, distance: parseFloat(e.target.value) || 0})}
                className="w-full border rounded-lg px-3 py-2"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">คะแนนจากลูกค้า</label>
              <select
                value={orderDetails.rating}
                onChange={(e) => setOrderDetails({...orderDetails, rating: parseInt(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value={1}>1 ดาว</option>
                <option value={2}>2 ดาว</option>
                <option value={3}>3 ดาว</option>
                <option value={4}>4 ดาว</option>
                <option value={5}>5 ดาว</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">สภาพอากาศ</label>
              <select
                value={orderDetails.weather}
                onChange={(e) => setOrderDetails({...orderDetails, weather: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
              >
                {weatherOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} {option.multiplier > 1 && `(+${Math.round((option.multiplier - 1) * 100)}%)`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">เวลาส่ง</label>
              <input
                type="range"
                min="0"
                max="23"
                value={orderDetails.hour}
                onChange={(e) => setOrderDetails({...orderDetails, hour: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>00:00</span>
                <span className="font-medium">{orderDetails.hour.toString().padStart(2, '0')}:00</span>
                <span>23:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bonus Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6">การคำนวณโบนัส</h2>
          
          <div className="space-y-4">
            {/* Base Amount */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span>💰</span>
                <span>ค่าส่งพื้นฐาน</span>
              </div>
              <span className="font-semibold">฿{orderDetails.baseAmount.toFixed(2)}</span>
            </div>

            {/* Peak Hour Bonus */}
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              calculatedBonuses.peakHour > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <span>🔥</span>
                <span>โบนัสช่วงเร่งด่วน</span>
                {calculatedBonuses.peakHour > 0 && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    ช่วงเวลาทอง
                  </span>
                )}
              </div>
              <span className={`font-semibold ${calculatedBonuses.peakHour > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                +฿{calculatedBonuses.peakHour.toFixed(2)}
              </span>
            </div>

            {/* Weather Bonus */}
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              calculatedBonuses.weather > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <span>🌧️</span>
                <span>โบนัสสภาพอากาศ</span>
                {calculatedBonuses.weather > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    สภาพอากาศเลว
                  </span>
                )}
              </div>
              <span className={`font-semibold ${calculatedBonuses.weather > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                +฿{calculatedBonuses.weather.toFixed(2)}
              </span>
            </div>

            {/* Distance Bonus */}
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              calculatedBonuses.distance > 0 ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <span>🛣️</span>
                <span>โบนัสระยะทาง</span>
                {calculatedBonuses.distance > 0 && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    >5 กม.
                  </span>
                )}
              </div>
              <span className={`font-semibold ${calculatedBonuses.distance > 0 ? 'text-purple-600' : 'text-gray-500'}`}>
                +฿{calculatedBonuses.distance.toFixed(2)}
              </span>
            </div>

            {/* Rating Bonus */}
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              calculatedBonuses.rating > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2">
                <span>⭐</span>
                <span>โบนัสคะแนนเต็ม</span>
                {calculatedBonuses.rating > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    5 ดาว
                  </span>
                )}
              </div>
              <span className={`font-semibold ${calculatedBonuses.rating > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>
                +฿{calculatedBonuses.rating.toFixed(2)}
              </span>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>💵</span>
                  <span className="font-semibold">รายได้รวม</span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  ฿{(orderDetails.baseAmount + calculatedBonuses.total).toFixed(2)}
                </span>
              </div>
              
              {calculatedBonuses.total > 0 && (
                <div className="text-center mt-2">
                  <span className="text-sm text-green-600">
                    โบนัสรวม: +฿{calculatedBonuses.total.toFixed(2)} 
                    ({Math.round((calculatedBonuses.total / orderDetails.baseAmount) * 100)}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bonus Tips */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">💡 เคล็ดลับเพิ่มโบนัส</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">🔥</div>
            <h4 className="font-medium text-orange-600 mb-1">ช่วงเร่งด่วน</h4>
            <p className="text-sm text-gray-600">11:00-14:00 (+20%)<br/>17:00-21:00 (+50%)</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">🌧️</div>
            <h4 className="font-medium text-blue-600 mb-1">สภาพอากาศ</h4>
            <p className="text-sm text-gray-600">ฝนตก (+30%)<br/>พายุ (+50%)</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">🛣️</div>
            <h4 className="font-medium text-purple-600 mb-1">ระยะทางไกล</h4>
            <p className="text-sm text-gray-600">มากกว่า 5 กม.<br/>+2 บาท/กม.</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">⭐</div>
            <h4 className="font-medium text-yellow-600 mb-1">คะแนนเต็ม</h4>
            <p className="text-sm text-gray-600">5 ดาว<br/>+20 บาท</p>
          </div>
        </div>
      </div>
    </div>
  );
}