'use client';

import { useState, useEffect } from 'react';
import { vehicleManager } from '@/lib/vehicle-management/vehicle-manager';

export default function VehicleManagementDashboard() {
  const [driverId] = useState('driver_001');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    typeId: '',
    licensePlate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    documents: {
      registration: '',
      insurance: '',
      inspection: ''
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setVehicles(vehicleManager.getDriverVehicles(driverId));
    setVehicleTypes(vehicleManager.getVehicleTypes());
    setActiveVehicle(vehicleManager.getActiveVehicle(driverId));
  };

  const addVehicle = () => {
    vehicleManager.addVehicle(driverId, newVehicle);
    setNewVehicle({
      typeId: '',
      licensePlate: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      documents: { registration: '', insurance: '', inspection: '' }
    });
    setShowAddForm(false);
    loadData();
  };

  const setActive = (vehicleId: string) => {
    const success = vehicleManager.setActiveVehicle(driverId, vehicleId);
    if (success) {
      loadData();
    } else {
      alert('ไม่สามารถเลือกยานพาหนะนี้ได้ (ยังไม่ได้รับการอนุมัติ)');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (typeId: string) => {
    const type = vehicleTypes.find(t => t.id === typeId);
    return type?.icon || '🚗';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">จัดการยานพาหนะ</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            เพิ่มยานพาหนะ
          </button>
        </div>

        {/* Active Vehicle */}
        {activeVehicle && (
          <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-6 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-2">ยานพาหนะที่ใช้งานปัจจุบัน</h2>
            <div className="flex items-center gap-4">
              <span className="text-3xl">{getTypeIcon(activeVehicle.typeId)}</span>
              <div>
                <div className="font-medium">{activeVehicle.brand} {activeVehicle.model}</div>
                <div className="text-sm text-gray-600">ทะเบียน: {activeVehicle.licensePlate}</div>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">ยานพาหนะทั้งหมด</h2>
          
          {vehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🚗</div>
              <p>ยังไม่มียานพาหนะ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map(vehicle => (
                <div
                  key={vehicle.id}
                  className={`border-2 rounded-lg p-4 ${
                    vehicle.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{getTypeIcon(vehicle.typeId)}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(vehicle.status)}`}>
                        {vehicle.status}
                      </span>
                      {vehicle.isActive && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          ใช้งาน
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div><strong>ทะเบียน:</strong> {vehicle.licensePlate}</div>
                    <div><strong>ยี่ห้อ:</strong> {vehicle.brand}</div>
                    <div><strong>รุ่น:</strong> {vehicle.model}</div>
                    <div><strong>ปี:</strong> {vehicle.year}</div>
                    <div><strong>สี:</strong> {vehicle.color}</div>
                  </div>

                  {vehicle.status === 'rejected' && vehicle.rejectedReason && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>เหตุผลที่ปฏิเสธ:</strong> {vehicle.rejectedReason}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    {vehicle.status === 'approved' && !vehicle.isActive && (
                      <button
                        onClick={() => setActive(vehicle.id)}
                        className="flex-1 bg-green-500 text-white py-2 px-3 rounded text-sm hover:bg-green-600"
                      >
                        เลือกใช้งาน
                      </button>
                    )}
                    {vehicle.isActive && (
                      <div className="flex-1 bg-gray-300 text-gray-600 py-2 px-3 rounded text-sm text-center">
                        กำลังใช้งาน
                      </div>
                    )}
                    {vehicle.status === 'pending' && (
                      <div className="flex-1 bg-yellow-100 text-yellow-700 py-2 px-3 rounded text-sm text-center">
                        รอการอนุมัติ
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Vehicle Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">เพิ่มยานพาหนะใหม่</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ประเภทยานพาหนะ</label>
                  <select
                    value={newVehicle.typeId}
                    onChange={(e) => setNewVehicle({...newVehicle, typeId: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">เลือกประเภท</option>
                    {vehicleTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">ทะเบียนรถ</label>
                    <input
                      type="text"
                      value={newVehicle.licensePlate}
                      onChange={(e) => setNewVehicle({...newVehicle, licensePlate: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="1กก 1234"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ยี่ห้อ</label>
                    <input
                      type="text"
                      value={newVehicle.brand}
                      onChange={(e) => setNewVehicle({...newVehicle, brand: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Honda, Toyota"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">รุ่น</label>
                    <input
                      type="text"
                      value={newVehicle.model}
                      onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Wave, Vios"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">ปี</label>
                    <input
                      type="number"
                      value={newVehicle.year}
                      onChange={(e) => setNewVehicle({...newVehicle, year: parseInt(e.target.value)})}
                      className="w-full p-2 border rounded-lg"
                      min="2000"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">สี</label>
                  <input
                    type="text"
                    value={newVehicle.color}
                    onChange={(e) => setNewVehicle({...newVehicle, color: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    placeholder="แดง, น้ำเงิน, ขาว"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">เอกสาร</h3>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={() => setNewVehicle({
                      ...newVehicle,
                      documents: {...newVehicle.documents, registration: 'uploaded_reg.jpg'}
                    })}
                    className="w-full text-sm"
                  />
                  <label className="text-xs text-gray-600">ทะเบียนรถ</label>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={addVehicle}
                  disabled={!newVehicle.typeId || !newVehicle.licensePlate}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  เพิ่ม
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}