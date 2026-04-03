'use client';

import { useState, useEffect } from 'react';
import { bulkOrderManager } from '@/lib/bulk-orders/bulk-order-manager';

export default function BulkOrderDashboard() {
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [stores, setStores] = useState([
    { id: '1', name: 'ร้านอาหารไทย ABC', category: 'thai' },
    { id: '2', name: 'ร้านอาหารจีน XYZ', category: 'chinese' },
    { id: '3', name: 'ร้านเบเกอรี่ DEF', category: 'bakery' }
  ]);
  const [selectedStore, setSelectedStore] = useState('');
  const [products, setProducts] = useState([
    { id: '1', name: 'ข้าวผัดกุ้ง', price: 120, storeId: '1' },
    { id: '2', name: 'ต้มยำกุ้ง', price: 150, storeId: '1' },
    { id: '3', name: 'ข้าวหมูแดง', price: 80, storeId: '2' },
    { id: '4', name: 'ขนมปังโฮลวีท', price: 45, storeId: '3' }
  ]);

  useEffect(() => {
    // Initialize new bulk order for demo
    const order = bulkOrderManager.createBulkOrder('business_001', 'บริษัท ABC จำกัด');
    setCurrentOrder(order);
  }, []);

  const addProduct = (productId: string, quantity: number) => {
    if (!currentOrder || !selectedStore) return;
    
    const product = products.find(p => p.id === productId);
    const store = stores.find(s => s.id === selectedStore);
    
    if (product && store) {
      bulkOrderManager.addItemToOrder(currentOrder.id, {
        storeId: store.id,
        storeName: store.name,
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price
      });
      
      // Refresh order data
      const updatedOrders = bulkOrderManager.getBulkOrders('business_001');
      setCurrentOrder(updatedOrders.find(o => o.id === currentOrder.id));
    }
  };

  const updateSchedule = (type: 'weekly' | 'monthly' | 'custom', frequency?: number) => {
    if (!currentOrder) return;
    
    bulkOrderManager.updateOrderSchedule(currentOrder.id, type, frequency);
    const updatedOrders = bulkOrderManager.getBulkOrders('business_001');
    setCurrentOrder(updatedOrders.find(o => o.id === currentOrder.id));
  };

  const storeOrders = currentOrder ? bulkOrderManager.getOrdersByStore(currentOrder.id) : {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">สั่งซื้อล่วงหน้าสำหรับธุรกิจ</h1>
        
        {/* Order Schedule Setup */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">ตั้งค่าการสั่งซื้อ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">ประเภทการสั่งซื้อ</label>
              <select 
                className="w-full p-2 border rounded-lg"
                value={currentOrder?.orderType || 'weekly'}
                onChange={(e) => updateSchedule(e.target.value as any)}
              >
                <option value="weekly">รายสัปดาห์</option>
                <option value="monthly">รายเดือน</option>
                <option value="custom">กำหนดเอง</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">วันที่เริ่มต้น</label>
              <input 
                type="date" 
                className="w-full p-2 border rounded-lg"
                value={currentOrder?.startDate || ''}
                onChange={(e) => {
                  if (currentOrder) {
                    currentOrder.startDate = e.target.value;
                    setCurrentOrder({...currentOrder});
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">วันที่สิ้นสุด</label>
              <input 
                type="date" 
                className="w-full p-2 border rounded-lg"
                value={currentOrder?.endDate || ''}
                onChange={(e) => {
                  if (currentOrder) {
                    currentOrder.endDate = e.target.value;
                    setCurrentOrder({...currentOrder});
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Store Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">เลือกร้านค้า</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stores.map(store => (
              <div 
                key={store.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedStore === store.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedStore(store.id)}
              >
                <h3 className="font-semibold">{store.name}</h3>
                <p className="text-sm text-gray-600">{store.category}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Product Selection */}
        {selectedStore && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">เลือกสินค้า</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.filter(p => p.storeId === selectedStore).map(product => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-green-600">฿{product.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="1" 
                      defaultValue="1"
                      className="w-16 p-1 border rounded"
                      id={`qty-${product.id}`}
                    />
                    <button 
                      onClick={() => {
                        const qty = parseInt((document.getElementById(`qty-${product.id}`) as HTMLInputElement).value);
                        addProduct(product.id, qty);
                      }}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      เพิ่ม
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Summary by Store */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">สรุปคำสั่งซื้อ</h2>
          {Object.keys(storeOrders).length === 0 ? (
            <p className="text-gray-500">ยังไม่มีสินค้าในคำสั่งซื้อ</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(storeOrders).map(([storeId, storeData]: [string, any]) => (
                <div key={storeId} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">{storeData.storeName}</h3>
                  <div className="space-y-2">
                    {storeData.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-medium">{item.productName}</span>
                          <span className="text-sm text-gray-600 ml-2">จำนวน: {item.quantity}</span>
                          <span className="text-sm text-gray-600 ml-2">วันส่ง: {item.deliveryDate}</span>
                        </div>
                        <span className="font-semibold">฿{item.quantity * item.unitPrice}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between font-semibold">
                      <span>รวมต่อร้าน:</span>
                      <span>฿{storeData.total}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>รวมทั้งหมด:</span>
                  <span>฿{currentOrder?.totalAmount || 0}</span>
                </div>
                <button 
                  onClick={() => currentOrder && bulkOrderManager.confirmOrder(currentOrder.id)}
                  className="w-full mt-4 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-semibold"
                >
                  ยืนยันคำสั่งซื้อ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}