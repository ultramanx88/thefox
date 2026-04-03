'use client';

import { useState, useEffect } from 'react';
import { loadCalculator } from '@/lib/load-calculator/load-calculator';

export default function LoadOptimizationDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [optimization, setOptimization] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('motorcycle');

  useEffect(() => {
    loadSampleOrders();
  }, []);

  const loadSampleOrders = () => {
    const sampleOrders = [
      {
        orderId: 'ORD001',
        items: [
          { id: '1', name: 'ผักสด', weight: 0.5, volume: 2, quantity: 10, category: 'fresh', stackable: true },
          { id: '2', name: 'ไข่ไก่', weight: 0.06, volume: 0.1, quantity: 30, category: 'fragile', stackable: false }
        ]
      },
      {
        orderId: 'ORD002',
        items: [
          { id: '3', name: 'เนื้อแช่แข็ง', weight: 1, volume: 1.5, quantity: 5, category: 'frozen', stackable: true },
          { id: '4', name: 'น้ำปลา', weight: 0.7, volume: 0.75, quantity: 8, category: 'liquid', stackable: true }
        ]
      },
      {
        orderId: 'ORD003',
        items: [
          { id: '5', name: 'ข้าวสาร', weight: 5, volume: 6, quantity: 2, category: 'dry', stackable: true },
          { id: '6', name: 'แก้วใส', weight: 0.2, volume: 0.3, quantity: 12, category: 'fragile', stackable: false }
        ]
      }
    ];

    const calculatedOrders = sampleOrders.map(order => 
      loadCalculator.calculateOrderLoad(order.orderId, order.items)
    );
    
    setOrders(calculatedOrders);
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const optimizeLoad = () => {
    if (selectedOrders.length === 0) return;
    
    const selectedOrderLoads = orders.filter(order => 
      selectedOrders.includes(order.orderId)
    );
    
    const result = loadCalculator.optimizeMultipleOrders(selectedOrderLoads, selectedVehicle);
    setOptimization(result);
    
    const recs = loadCalculator.getLoadRecommendations(selectedOrderLoads);
    setRecommendations(recs);
  };

  const getVehicleIcon = (vehicleType: string) => {
    const icons = {
      motorcycle: '🏍️',
      car: '🚗',
      pickup: '🚚'
    };
    return icons[vehicleType as keyof typeof icons] || '🚗';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      fresh: 'bg-green-100 text-green-800',
      frozen: 'bg-blue-100 text-blue-800',
      fragile: 'bg-red-100 text-red-800',
      liquid: 'bg-purple-100 text-purple-800',
      dry: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const vehicleCapacities = {
    motorcycle: { maxWeight: 30, maxVolume: 50, maxItems: 15 },
    car: { maxWeight: 200, maxVolume: 300, maxItems: 50 },
    pickup: { maxWeight: 500, maxVolume: 800, maxItems: 100 }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">ระบบคำนวณน้ำหนักและปริมาตร</h1>

        {/* Vehicle Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">เลือกประเภทยานพาหนะ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(vehicleCapacities).map(([type, capacity]) => (
              <div
                key={type}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedVehicle === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedVehicle(type)}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{getVehicleIcon(type)}</div>
                  <h3 className="font-semibold capitalize">{type}</h3>
                  <div className="text-sm text-gray-600 mt-2">
                    <div>น้ำหนัก: {capacity.maxWeight} กก.</div>
                    <div>ปริมาตร: {capacity.maxVolume} ลิตร</div>
                    <div>จำนวน: {capacity.maxItems} ชิ้น</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">รายการออเดอร์</h2>
              <button
                onClick={optimizeLoad}
                disabled={selectedOrders.length === 0}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                คำนวณ ({selectedOrders.length})
              </button>
            </div>
            
            <div className="space-y-3">
              {orders.map(order => (
                <div
                  key={order.orderId}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedOrders.includes(order.orderId) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => toggleOrderSelection(order.orderId)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{order.orderId}</h3>
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.orderId)}
                      onChange={() => toggleOrderSelection(order.orderId)}
                      className="w-4 h-4"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                    <div>น้ำหนัก: {order.totalWeight.toFixed(1)} กก.</div>
                    <div>ปริมาตร: {order.totalVolume.toFixed(1)} ลิตร</div>
                    <div>จำนวน: {order.totalItems} ชิ้น</div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {order.items.map((item: any) => (
                      <span key={item.id} className={`px-2 py-1 rounded text-xs ${getCategoryColor(item.category)}`}>
                        {item.name} x{item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">ผลการคำนวณ</h2>
            
            {optimization ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl mb-2">{getVehicleIcon(optimization.vehicleTypeId)}</div>
                  <div className="font-semibold capitalize">{optimization.vehicleTypeId}</div>
                  <div className="text-sm text-gray-600">
                    ประสิทธิภาพ: {(optimization.utilizationRate * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{optimization.totalWeight.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">กก.</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{optimization.totalVolume.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">ลิตร</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{optimization.totalItems}</div>
                    <div className="text-sm text-gray-600">ชิ้น</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">ออเดอร์ที่บรรทุกได้:</h3>
                  <div className="space-y-1">
                    {optimization.orders.map((orderId: string) => (
                      <div key={orderId} className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        ✓ {orderId}
                      </div>
                    ))}
                  </div>
                </div>

                {optimization.warnings.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2 text-red-600">คำเตือน:</h3>
                    <div className="space-y-1">
                      {optimization.warnings.map((warning: string, index: number) => (
                        <div key={index} className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                          ⚠️ {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Capacity Bars */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>น้ำหนัก</span>
                      <span>{((optimization.totalWeight / vehicleCapacities[selectedVehicle as keyof typeof vehicleCapacities].maxWeight) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min((optimization.totalWeight / vehicleCapacities[selectedVehicle as keyof typeof vehicleCapacities].maxWeight) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>ปริมาตร</span>
                      <span>{((optimization.totalVolume / vehicleCapacities[selectedVehicle as keyof typeof vehicleCapacities].maxVolume) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min((optimization.totalVolume / vehicleCapacities[selectedVehicle as keyof typeof vehicleCapacities].maxVolume) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>จำนวนชิ้น</span>
                      <span>{((optimization.totalItems / vehicleCapacities[selectedVehicle as keyof typeof vehicleCapacities].maxItems) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${Math.min((optimization.totalItems / vehicleCapacities[selectedVehicle as keyof typeof vehicleCapacities].maxItems) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>เลือกออเดอร์และกดคำนวณ</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">คำแนะนำยานพาหนะ</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="text-center mb-3">
                    <div className="text-2xl mb-1">{getVehicleIcon(rec.vehicleType)}</div>
                    <h3 className="font-semibold capitalize">{rec.vehicleType}</h3>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div>ประสิทธิภาพ: {(rec.efficiency * 100).toFixed(1)}%</div>
                    <div>ออเดอร์ที่บรรทุกได้: {rec.optimization.orders.length}</div>
                    <div>น้ำหนักรวม: {rec.optimization.totalWeight.toFixed(1)} กก.</div>
                  </div>
                  
                  {index === 0 && (
                    <div className="mt-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded text-center">
                      แนะนำ
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}