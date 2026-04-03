'use client';

import { useState, useEffect } from 'react';
import { orderTimingCalculator } from '@/lib/order-timing/timing-calculator';

export default function OrderTimingDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [newOrder, setNewOrder] = useState({
    orderId: '',
    items: [
      { id: '1', name: 'ผักสด', category: 'fresh', weight: 2, quantity: 1, preparationTime: 5, freshnessLevel: 'high', specialHandling: false },
      { id: '2', name: 'เนื้อแช่แข็ง', category: 'frozen', weight: 1.5, quantity: 2, preparationTime: 3, freshnessLevel: 'medium', specialHandling: true }
    ] as any[],
    pickupLocation: { lat: 13.7563, lng: 100.5018, address: 'ร้านวัตถุดิบ ABC' },
    deliveryLocation: { lat: 13.7463, lng: 100.5118, address: 'บ้านลูกค้า' }
  });
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    // Load sample orders
    loadSampleOrders();
  }, []);

  const loadSampleOrders = () => {
    const sampleOrders = [
      {
        orderId: 'ORD001',
        storeId: 'store_001',
        items: [
          { id: '1', name: 'ผักสดรวม', category: 'fresh', weight: 3, quantity: 1, preparationTime: 8, freshnessLevel: 'high', specialHandling: false },
          { id: '2', name: 'ไข่ไก่', category: 'fragile', weight: 1, quantity: 2, preparationTime: 2, freshnessLevel: 'medium', specialHandling: true }
        ],
        pickupLocation: { lat: 13.7563, lng: 100.5018, address: 'ร้านวัตถุดิบ ABC' },
        deliveryLocation: { lat: 13.7463, lng: 100.5118, address: 'บ้านลูกค้า A' }
      }
    ];

    const calculatedOrders = sampleOrders.map(order => 
      orderTimingCalculator.calculateOrderTiming(order)
    );
    
    setOrders(calculatedOrders);
  };

  const calculateNewOrder = () => {
    if (!newOrder.orderId) return;
    
    const timing = orderTimingCalculator.calculateOrderTiming({
      orderId: newOrder.orderId,
      storeId: 'store_001',
      items: newOrder.items,
      pickupLocation: newOrder.pickupLocation,
      deliveryLocation: newOrder.deliveryLocation
    });
    
    setOrders([...orders, timing]);
    setNewOrder({
      ...newOrder,
      orderId: '',
      items: []
    });
    setShowCalculator(false);
  };

  const getStatusColor = (readyTime: string) => {
    const ready = new Date(readyTime);
    const now = new Date();
    const diff = ready.getTime() - now.getTime();
    
    if (diff < 0) return 'bg-green-100 text-green-800'; // Ready
    if (diff < 10 * 60000) return 'bg-yellow-100 text-yellow-800'; // Almost ready
    return 'bg-blue-100 text-blue-800'; // Preparing
  };

  const getTimeRemaining = (targetTime: string) => {
    const target = new Date(targetTime);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    
    if (diff < 0) return 'เสร็จแล้ว';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}ชม ${minutes % 60}นาที`;
    }
    return `${minutes}นาที`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">ระบบคำนวณเวลาการจัดของ</h1>
          <button
            onClick={() => setShowCalculator(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            คำนวณออเดอร์ใหม่
          </button>
        </div>

        {/* Current Traffic Conditions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">สภาพการจราจรปัจจุบัน</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">ปกติ</div>
              <div className="text-sm text-gray-600">06:00-09:00</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">ปานกลาง</div>
              <div className="text-sm text-gray-600">09:00-11:00</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600">หนาแน่น</div>
              <div className="text-sm text-gray-600">11:00-13:00</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">ปัจจุบัน: x1.2</div>
              <div className="text-sm text-gray-600">ตัวคูณเวลา</div>
            </div>
          </div>
        </div>

        {/* Orders Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">ตารางเวลาออเดอร์</h2>
          
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">ไม่มีออเดอร์</p>
          ) : (
            <div className="space-y-4">
              {orders.map(order => {
                const breakdown = orderTimingCalculator.getTimingBreakdown(order);
                return (
                  <div key={order.orderId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">Order #{order.orderId}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.readyTime)}`}>
                        {getTimeRemaining(order.readyTime)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{breakdown.preparation.time}นาที</div>
                        <div className="text-sm text-gray-600">จัดเตรียม</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-600">{breakdown.buffer.time}นาที</div>
                        <div className="text-sm text-gray-600">สำรอง</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{breakdown.travel.time}นาที</div>
                        <div className="text-sm text-gray-600">เดินทาง</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{breakdown.total.time}นาที</div>
                        <div className="text-sm text-gray-600">รวม</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <strong>เสร็จ:</strong> {new Date(order.readyTime).toLocaleString('th-TH')}
                      </div>
                      <div>
                        <strong>รับ:</strong> {new Date(order.pickupTime).toLocaleString('th-TH')}
                      </div>
                      <div>
                        <strong>ส่ง:</strong> {new Date(order.deliveryTime).toLocaleString('th-TH')}
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm">
                        <strong>จ่ายงานคนขับ:</strong> {new Date(order.driverAssignTime).toLocaleString('th-TH')}
                        <span className="ml-2 text-gray-600">
                          (อีก {getTimeRemaining(order.driverAssignTime)})
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <strong className="text-sm">สินค้า:</strong>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {order.items.map((item: any) => (
                          <span key={item.id} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {item.name} ({item.quantity}) - {item.freshnessLevel}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calculator Modal */}
        {showCalculator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">คำนวณเวลาออเดอร์ใหม่</h2>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="รหัสออเดอร์"
                  value={newOrder.orderId}
                  onChange={(e) => setNewOrder({...newOrder, orderId: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />

                <div>
                  <h3 className="font-medium mb-2">สินค้าตัวอย่าง</h3>
                  <div className="space-y-2">
                    {newOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <span className="flex-1">{item.name}</span>
                        <span className="text-sm text-gray-600">{item.weight}kg</span>
                        <span className="text-sm text-gray-600">x{item.quantity}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.freshnessLevel === 'high' ? 'bg-red-100 text-red-800' :
                          item.freshnessLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.freshnessLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">ที่อยู่รับสินค้า</label>
                    <input
                      type="text"
                      value={newOrder.pickupLocation.address}
                      onChange={(e) => setNewOrder({
                        ...newOrder,
                        pickupLocation: {...newOrder.pickupLocation, address: e.target.value}
                      })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ที่อยู่ส่งสินค้า</label>
                    <input
                      type="text"
                      value={newOrder.deliveryLocation.address}
                      onChange={(e) => setNewOrder({
                        ...newOrder,
                        deliveryLocation: {...newOrder.deliveryLocation, address: e.target.value}
                      })}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowCalculator(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={calculateNewOrder}
                  disabled={!newOrder.orderId}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  คำนวณ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}