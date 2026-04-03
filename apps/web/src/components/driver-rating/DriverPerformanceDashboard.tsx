'use client';

import { useState, useEffect } from 'react';
import { driverRatingManager } from '@/lib/driver-rating/rating-manager';

export default function DriverPerformanceDashboard() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  useEffect(() => {
    loadData();
    // Add sample data
    driverRatingManager.addRating({
      driverId: 'driver_001',
      orderId: 'order_001',
      customerId: 'customer_001',
      rating: 5,
      criteria: { speed: 5, politeness: 5, foodCondition: 4, communication: 5 },
      comment: 'บริการดีมาก ส่งเร็ว สุภาพ'
    });
    driverRatingManager.recordDelivery('driver_001', true);
    loadData();
  }, []);

  const loadData = () => {
    let filteredDrivers = driverRatingManager.getAllDrivers();
    
    if (searchQuery) {
      filteredDrivers = driverRatingManager.searchDrivers(searchQuery);
    }
    
    if (ratingFilter !== 'all') {
      const [min, max] = ratingFilter.split('-').map(Number);
      filteredDrivers = driverRatingManager.getDriversByRatingRange(min, max);
    }
    
    setDrivers(filteredDrivers);
    setStats(driverRatingManager.getDriverStats());
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, ratingFilter]);

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    if (rating >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(Math.round(rating));
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">ประเมินผลคนขับ</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalDrivers}</div>
            <div className="text-sm text-gray-600">คนขับทั้งหมด</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeDrivers}</div>
            <div className="text-sm text-gray-600">คนขับที่ใช้งาน</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.avgRating.toFixed(1)}</div>
            <div className="text-sm text-gray-600">คะแนนเฉลี่ย</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalRatings}</div>
            <div className="text-sm text-gray-600">การให้คะแนน</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.excellentDrivers}</div>
            <div className="text-sm text-gray-600">คนขับดีเด่น</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">รายชื่อคนขับ</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ค้นหาคนขับ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1 border rounded-lg text-sm"
                />
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  <option value="all">ทุกคะแนน</option>
                  <option value="4.5-5">4.5-5 ดาว</option>
                  <option value="4-4.5">4-4.5 ดาว</option>
                  <option value="3-4">3-4 ดาว</option>
                  <option value="0-3">ต่ำกว่า 3 ดาว</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {drivers.map(driver => (
                <div
                  key={driver.driverId}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedDriver?.driverId === driver.driverId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedDriver(driver)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{driver.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${getRatingColor(driver.averageRating)}`}>
                        {driver.averageRating > 0 ? driver.averageRating.toFixed(1) : 'N/A'}
                      </span>
                      <span>{getRatingStars(driver.averageRating)}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                    <div>📦 {driver.totalDeliveries} การส่ง</div>
                    <div>📊 {driver.totalRatings} คะแนน</div>
                    <div>⏰ {driver.totalDeliveries > 0 ? ((driver.onTimeDeliveries / driver.totalDeliveries) * 100).toFixed(0) : 0}% ตรงเวลา</div>
                    <div>❌ {driver.cancelledOrders} ยกเลิก</div>
                  </div>

                  {driver.badges.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {driver.badges.map((badge, index) => (
                        <span key={index} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Driver Detail */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedDriver ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">รายละเอียดคนขับ</h2>
                
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold">{selectedDriver.name}</h3>
                  <div className="text-3xl font-bold text-yellow-500 my-2">
                    {selectedDriver.averageRating > 0 ? selectedDriver.averageRating.toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-2xl">{getRatingStars(selectedDriver.averageRating)}</div>
                  <p className="text-sm text-gray-600">{selectedDriver.totalRatings} การให้คะแนน</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">สถิติการส่ง</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>การส่งทั้งหมด:</span>
                        <span className="font-medium">{selectedDriver.totalDeliveries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ส่งตรงเวลา:</span>
                        <span className="font-medium text-green-600">{selectedDriver.onTimeDeliveries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ส่งช้า:</span>
                        <span className="font-medium text-red-600">{selectedDriver.lateDeliveries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ยกเลิก:</span>
                        <span className="font-medium text-gray-600">{selectedDriver.cancelledOrders}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">คะแนนรายหมวด</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedDriver.criteriaAverages).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm">{
                            key === 'speed' ? 'ความเร็ว' :
                            key === 'politeness' ? 'มารยาท' :
                            key === 'foodCondition' ? 'สภาพอาหาร' : 'การสื่อสาร'
                          }:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{(value as number).toFixed(1)}</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${((value as number) / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedDriver.badges.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">เหรียญรางวัล</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedDriver.badges.map((badge, index) => (
                          <span key={index} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">👆</div>
                <p>เลือกคนขับเพื่อดูรายละเอียด</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}