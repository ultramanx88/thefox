'use client';

import { useState } from 'react';
import { vehicleManager } from '@/lib/vehicle-management/vehicle-manager';

interface JobAssignmentProps {
  job: any;
  onAssign: (driverId: string, vehicleId: string) => void;
  onCancel: () => void;
}

export default function JobAssignment({ job, onAssign, onCancel }: JobAssignmentProps) {
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [driverVehicles, setDriverVehicles] = useState<any[]>([]);

  const drivers = [
    { id: 'driver_001', name: 'สมชาย ใจดี' },
    { id: 'driver_002', name: 'สมหญิง ใจงาม' }
  ];

  const handleDriverSelect = (driverId: string) => {
    setSelectedDriver(driverId);
    setSelectedVehicle('');
    
    const vehicles = vehicleManager.getDriverVehicles(driverId)
      .filter(v => v.status === 'approved');
    setDriverVehicles(vehicles);
  };

  const getVehicleType = (typeId: string) => {
    const types = vehicleManager.getVehicleTypes();
    return types.find(t => t.id === typeId);
  };

  const handleAssign = () => {
    if (selectedDriver && selectedVehicle) {
      onAssign(selectedDriver, selectedVehicle);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">จ่ายงานให้คนขับ</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">รายละเอียดงาน</h3>
          <div className="text-sm space-y-1">
            <div>คำสั่งซื้อ: {job.orderId}</div>
            <div>เวลา: {job.timeSlot}</div>
            <div>รับที่: {job.pickupLocation?.address}</div>
            <div>ส่งที่: {job.deliveryLocation?.address}</div>
          </div>
        </div>

        {/* Driver Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">เลือกคนขับ</label>
          <div className="space-y-2">
            {drivers.map(driver => (
              <div
                key={driver.id}
                className={`border-2 rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedDriver === driver.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleDriverSelect(driver.id)}
              >
                <div className="font-medium">{driver.name}</div>
                <div className="text-sm text-gray-600">ID: {driver.id}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Selection */}
        {selectedDriver && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">เลือกยานพาหนะ</label>
            {driverVehicles.length === 0 ? (
              <div className="text-red-600 text-sm">คนขับคนนี้ไม่มียานพาหนะที่ใช้งานได้</div>
            ) : (
              <div className="space-y-2">
                {driverVehicles.map(vehicle => {
                  const vehicleType = getVehicleType(vehicle.typeId);
                  return (
                    <div
                      key={vehicle.id}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedVehicle === vehicle.id 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{vehicleType?.icon}</span>
                        <div>
                          <div className="font-medium">{vehicle.brand} {vehicle.model}</div>
                          <div className="text-sm text-gray-600">
                            ทะเบียน: {vehicle.licensePlate} | {vehicleType?.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedDriver || !selectedVehicle}
            className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            จ่ายงาน
          </button>
        </div>
      </div>
    </div>
  );
}