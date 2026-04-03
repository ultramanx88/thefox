'use client';

import { useState, useEffect } from 'react';
import { vehicleManager } from '@/lib/vehicle-management/vehicle-manager';

export default function VehicleApprovalDashboard() {
  const [pendingVehicles, setPendingVehicles] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [newType, setNewType] = useState({
    name: '',
    icon: '',
    maxCapacity: 1,
    enabled: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPendingVehicles(vehicleManager.getPendingVehicles());
    setVehicleTypes(vehicleManager.getAllVehicleTypes());
    setStats(vehicleManager.getVehicleStats());
  };

  const approveVehicle = (vehicleId: string) => {
    vehicleManager.approveVehicle(vehicleId);
    loadData();
  };

  const rejectVehicle = (vehicleId: string, reason: string) => {
    if (!reason.trim()) {
      alert('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }
    vehicleManager.rejectVehicle(vehicleId, reason);
    loadData();
  };

  const addVehicleType = () => {
    if (!newType.name || !newType.icon) return;
    vehicleManager.addVehicleType(newType);
    setNewType({ name: '', icon: '', maxCapacity: 1, enabled: true });
    loadData();
  };

  const toggleVehicleType = (typeId: string, enabled: boolean) => {
    vehicleManager.updateVehicleType(typeId, { enabled });
    loadData();
  };

  const getTypeInfo = (typeId: string) => {
    return vehicleTypes.find(t => t.id === typeId);
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">อนุมัติยานพาหนะ</h1>
          <button
            onClick={() => setShowTypeManager(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            จัดการประเภทยานพาหนะ
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">ทั้งหมด</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">รอการอนุมัติ</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">อนุมัติแล้ว</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">ปฏิเสธ</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.active}</div>
            <div className="text-sm text-gray-600">ใช้งานอยู่</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Vehicles */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">ยานพาหนะรอการอนุมัติ</h2>
            
            {pendingVehicles.length === 0 ? (
              <p className="text-gray-500 text-center py-8">ไม่มียานพาหนะที่รอการอนุมัติ</p>
            ) : (
              <div className="space-y-4">
                {pendingVehicles.map(vehicle => {
                  const typeInfo = getTypeInfo(vehicle.typeId);
                  return (
                    <div
                      key={vehicle.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedVehicle?.id === vehicle.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{typeInfo?.icon}</span>
                          <h3 className="font-semibold">{vehicle.brand} {vehicle.model}</h3>
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                          รอการอนุมัติ
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                        <div>ทะเบียน: {vehicle.licensePlate}</div>
                        <div>ประเภท: {typeInfo?.name}</div>
                        <div>ปี: {vehicle.year}</div>
                        <div>สี: {vehicle.color}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vehicle Detail */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedVehicle ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">รายละเอียดยานพาหนะ</h2>
                
                <div className="space-y-3 mb-6">
                  <div><strong>ทะเบียน:</strong> {selectedVehicle.licensePlate}</div>
                  <div><strong>ยี่ห้อ:</strong> {selectedVehicle.brand}</div>
                  <div><strong>รุ่น:</strong> {selectedVehicle.model}</div>
                  <div><strong>ปี:</strong> {selectedVehicle.year}</div>
                  <div><strong>สี:</strong> {selectedVehicle.color}</div>
                  <div><strong>ประเภท:</strong> {getTypeInfo(selectedVehicle.typeId)?.name}</div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium mb-2">เอกสาร</h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>ทะเบียนรถ:</span>
                      <span className={selectedVehicle.documents.registration ? 'text-green-600' : 'text-red-600'}>
                        {selectedVehicle.documents.registration ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>ประกันภัย:</span>
                      <span className={selectedVehicle.documents.insurance ? 'text-green-600' : 'text-red-600'}>
                        {selectedVehicle.documents.insurance ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => approveVehicle(selectedVehicle.id)}
                    className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                  >
                    อนุมัติ
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('เหตุผลในการปฏิเสธ:');
                      if (reason) rejectVehicle(selectedVehicle.id, reason);
                    }}
                    className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                  >
                    ปฏิเสธ
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">👆</div>
                <p>เลือกยานพาหนะเพื่อดูรายละเอียด</p>
              </div>
            )}
          </div>
        </div>

        {/* Vehicle Type Manager */}
        {showTypeManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">จัดการประเภทยานพาหนะ</h2>
              
              {/* Add New Type */}
              <div className="border rounded-lg p-4 mb-4">
                <h3 className="font-medium mb-3">เพิ่มประเภทใหม่</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="ชื่อประเภท"
                    value={newType.name}
                    onChange={(e) => setNewType({...newType, name: e.target.value})}
                    className="p-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="ไอคอน (🚗)"
                    value={newType.icon}
                    onChange={(e) => setNewType({...newType, icon: e.target.value})}
                    className="p-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="ความจุสูงสุด"
                    value={newType.maxCapacity}
                    onChange={(e) => setNewType({...newType, maxCapacity: parseInt(e.target.value)})}
                    className="p-2 border rounded"
                    min="1"
                  />
                </div>
                <button
                  onClick={addVehicleType}
                  disabled={!newType.name || !newType.icon}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  เพิ่ม
                </button>
              </div>

              {/* Existing Types */}
              <div className="space-y-2">
                <h3 className="font-medium">ประเภทที่มีอยู่</h3>
                {vehicleTypes.map(type => (
                  <div key={type.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{type.icon}</span>
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm text-gray-600">ความจุ: {type.maxCapacity}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleVehicleType(type.id, !type.enabled)}
                      className={`px-3 py-1 rounded text-sm ${
                        type.enabled 
                          ? 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800' 
                          : 'bg-red-100 text-red-800 hover:bg-green-100 hover:text-green-800'
                      }`}
                    >
                      {type.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowTypeManager(false)}
                className="w-full mt-4 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
              >
                ปิด
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}