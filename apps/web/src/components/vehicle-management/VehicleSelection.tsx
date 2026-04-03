'use client';

import { useState, useEffect } from 'react';
import { vehicleManager } from '@/lib/vehicle-management/vehicle-manager';

interface VehicleSelectionProps {
  driverId: string;
  jobId: string;
  onVehicleSelect: (vehicleId: string) => void;
  onCancel: () => void;
}

export default function VehicleSelection({ driverId, jobId, onVehicleSelect, onCancel }: VehicleSelectionProps) {
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);

  useEffect(() => {
    loadVehicles();
  }, [driverId]);

  const loadVehicles = () => {
    const vehicles = vehicleManager.getDriverVehicles(driverId)
      .filter(v => v.status === 'approved');
    setAvailableVehicles(vehicles);
    setVehicleTypes(vehicleManager.getVehicleTypes());
    
    // Auto-select if only one vehicle
    if (vehicles.length === 1) {
      setSelectedVehicle(vehicles[0].id);
    }
  };

  const getVehicleType = (typeId: string) => {
    return vehicleTypes.find(t => t.id === typeId);
  };

  const handleConfirm = () => {
    if (selectedVehicle) {
      onVehicleSelect(selectedVehicle);
    }
  };

  if (availableVehicles.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">ไม่มียานพาหนะที่ใช้งานได้</h2>
          <p className="text-gray-600 mb-4">
            คุณไม่มียานพาหนะที่ได้รับการอนุมัติแล้ว
          </p>
          <button
            onClick={onCancel}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
          >
            ปิด
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">เลือกยานพาหนะสำหรับงานนี้</h2>
        <p className="text-gray-600 mb-6">งาน ID: {jobId}</p>
        
        <div className="space-y-3 mb-6">
          {availableVehicles.map(vehicle => {
            const vehicleType = getVehicleType(vehicle.typeId);
            return (
              <div
                key={vehicle.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedVehicle === vehicle.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedVehicle(vehicle.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{vehicleType?.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{vehicle.brand} {vehicle.model}</div>
                    <div className="text-sm text-gray-600">
                      ทะเบียน: {vehicle.licensePlate} | {vehicleType?.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      ความจุ: {vehicleType?.maxCapacity} รายการ
                    </div>
                  </div>
                  {selectedVehicle === vehicle.id && (
                    <div className="text-blue-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedVehicle}
            className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}