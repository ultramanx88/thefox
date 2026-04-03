'use client';

import { useState, useEffect } from 'react';
import { deliverySchedulingManager } from '@/lib/delivery-scheduling/delivery-scheduler';
import { continuousAssignmentManager } from '@/lib/delivery-scheduling/continuous-assignment';
import AutoAssignmentControl from './AutoAssignmentControl';

export default function DeliverySchedulingDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleOverview, setScheduleOverview] = useState<any[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [newJob, setNewJob] = useState({
    orderId: '',
    scheduledDate: selectedDate,
    timeSlot: '09:00',
    pickupAddress: '',
    deliveryAddress: '',
    priority: 'medium' as const
  });

  useEffect(() => {
    // Initialize with sample data
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);
    
    deliverySchedulingManager.createAdvanceSchedule(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    
    // Add sample driver availability
    deliverySchedulingManager.updateDriverAvailability('driver_001', [
      selectedDate,
      new Date(Date.now() + 86400000).toISOString().split('T')[0],
      new Date(Date.now() + 172800000).toISOString().split('T')[0]
    ]);
    
    updateOverview();
  }, []);

  const updateOverview = () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);
    
    const overview = deliverySchedulingManager.getScheduleOverview(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    setScheduleOverview(overview);
    
    const drivers = deliverySchedulingManager.getAvailableDrivers(selectedDate, newJob.timeSlot);
    setAvailableDrivers(drivers);
  };

  const scheduleNewJob = () => {
    if (!newJob.orderId || !newJob.pickupAddress || !newJob.deliveryAddress) return;
    
    const job = {
      orderId: newJob.orderId,
      scheduledDate: newJob.scheduledDate,
      timeSlot: newJob.timeSlot,
      pickupLocation: { lat: 13.7563, lng: 100.5018, address: newJob.pickupAddress },
      deliveryLocation: { lat: 13.7463, lng: 100.5118, address: newJob.deliveryAddress },
      estimatedDuration: 45,
      priority: newJob.priority
    };
    
    // Add to continuous assignment queue instead of direct scheduling
    const newJobObj = {
      ...job,
      id: `job_${Date.now()}`,
      status: 'scheduled' as const
    };
    
    continuousAssignmentManager.addJobToQueue(newJobObj);
    
    setNewJob({
      orderId: '',
      scheduledDate: selectedDate,
      timeSlot: '09:00',
      pickupAddress: '',
      deliveryAddress: '',
      priority: 'medium'
    });
    
    updateOverview();
  };

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">ระบบจ่ายงานล่วงหน้า</h1>
        
        {/* Auto Assignment Control */}
        <AutoAssignmentControl />
        
        {/* Schedule Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">ภาพรวมตารางงาน 7 วันข้างหน้า</h2>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {scheduleOverview.map((day, index) => (
              <div key={index} className="border rounded-lg p-4 text-center">
                <div className="font-semibold text-sm mb-2">
                  {new Date(day.date).toLocaleDateString('th-TH', { 
                    weekday: 'short', 
                    day: 'numeric',
                    month: 'short'
                  })}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="text-blue-600">งาน: {day.totalJobs}</div>
                  <div className="text-green-600">คนส่ง: {day.totalDrivers}</div>
                  <div className="text-orange-600">รอจ่าย: {day.unassignedJobs}</div>
                  <div className="text-gray-600">ความจุ: {day.capacity}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job Scheduling Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">จ่ายงานใหม่</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">รหัสคำสั่งซื้อ</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                value={newJob.orderId}
                onChange={(e) => setNewJob({...newJob, orderId: e.target.value})}
                placeholder="ORD001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">วันที่ส่ง</label>
              <input
                type="date"
                className="w-full p-2 border rounded-lg"
                value={newJob.scheduledDate}
                onChange={(e) => {
                  setNewJob({...newJob, scheduledDate: e.target.value});
                  setSelectedDate(e.target.value);
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ช่วงเวลา</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={newJob.timeSlot}
                onChange={(e) => setNewJob({...newJob, timeSlot: e.target.value})}
              >
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ที่อยู่รับสินค้า</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                value={newJob.pickupAddress}
                onChange={(e) => setNewJob({...newJob, pickupAddress: e.target.value})}
                placeholder="ร้านอาหาร ABC"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ที่อยู่ส่งสินค้า</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                value={newJob.deliveryAddress}
                onChange={(e) => setNewJob({...newJob, deliveryAddress: e.target.value})}
                placeholder="บริษัท XYZ"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ความสำคัญ</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={newJob.priority}
                onChange={(e) => setNewJob({...newJob, priority: e.target.value as any})}
              >
                <option value="low">ต่ำ</option>
                <option value="medium">ปานกลาง</option>
                <option value="high">สูง</option>
                <option value="urgent">เร่งด่วน</option>
              </select>
            </div>
          </div>
          <button
            onClick={scheduleNewJob}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            จ่ายงาน
          </button>
        </div>

        {/* Available Drivers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            คนส่งที่ว่างในวันที่ {new Date(selectedDate).toLocaleDateString('th-TH')}
          </h2>
          {availableDrivers.length === 0 ? (
            <p className="text-gray-500">ไม่มีคนส่งที่ว่างในวันนี้</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableDrivers.map(driver => {
                const schedule = deliverySchedulingManager.getDriverSchedule(driver.id, selectedDate);
                return (
                  <div key={driver.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{driver.name}</h3>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        ⭐ {driver.rating}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>📱 {driver.phone}</div>
                      <div>🏍️ {driver.vehicleType}</div>
                      <div>📦 งานวันนี้: {schedule?.jobs.length || 0}/{driver.maxOrders}</div>
                      <div>💰 รายได้คาดการณ์: ฿{schedule?.estimatedEarnings || 0}</div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${((schedule?.jobs.length || 0) / driver.maxOrders) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ความจุ: {((schedule?.jobs.length || 0) / driver.maxOrders * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}