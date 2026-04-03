'use client';

import { useState, useEffect } from 'react';
import { deliverySchedulingManager } from '@/lib/delivery-scheduling/delivery-scheduler';
import VehicleSelection from '@/components/vehicle-management/VehicleSelection';

export default function DriverApp() {
  const [driverId] = useState('driver_001'); // In real app, get from auth
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedule, setSchedule] = useState<any>(null);
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [showVehicleSelection, setShowVehicleSelection] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  useEffect(() => {
    loadSchedule();
  }, [selectedDate]);

  const loadSchedule = () => {
    const driverSchedule = deliverySchedulingManager.getDriverSchedule(driverId, selectedDate);
    setSchedule(driverSchedule);
    
    if (driverSchedule?.jobs.length > 0) {
      const activeJob = driverSchedule.jobs.find(job => 
        job.status === 'assigned' || job.status === 'in_progress'
      );
      setCurrentJob(activeJob || driverSchedule.jobs[0]);
    }
  };

  const updateJobStatus = (jobId: string, status: string) => {
    if (status === 'in_progress') {
      setSelectedJobId(jobId);
      setShowVehicleSelection(true);
      return;
    }
    
    if (schedule) {
      const job = schedule.jobs.find((j: any) => j.id === jobId);
      if (job) {
        job.status = status;
        setSchedule({...schedule});
      }
    }
  };

  const handleVehicleSelect = (vehicleId: string) => {
    if (schedule && selectedJobId) {
      const job = schedule.jobs.find((j: any) => j.id === selectedJobId);
      if (job) {
        job.status = 'in_progress';
        job.selectedVehicleId = vehicleId;
        setSchedule({...schedule});
      }
    }
    setShowVehicleSelection(false);
    setSelectedJobId('');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">แอปคนส่งของ</h1>
        <p className="text-blue-100">สมชาย ใจดี - 🏍️ มอเตอร์ไซค์</p>
      </div>

      {/* Date Selector */}
      <div className="bg-white p-4 border-b">
        <input
          type="date"
          className="w-full p-2 border rounded-lg"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Current Job */}
      {currentJob && (
        <div className="bg-white m-4 rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">งานปัจจุบัน</h2>
            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(currentJob.status)}`}>
              {currentJob.status}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div><strong>คำสั่งซื้อ:</strong> {currentJob.orderId}</div>
            <div><strong>เวลา:</strong> {currentJob.timeSlot}</div>
            <div className={`font-semibold ${getPriorityColor(currentJob.priority)}`}>
              ความสำคัญ: {currentJob.priority}
            </div>
            <div><strong>รับที่:</strong> {currentJob.pickupLocation.address}</div>
            <div><strong>ส่งที่:</strong> {currentJob.deliveryLocation.address}</div>
            {currentJob.specialInstructions && (
              <div><strong>หมายเหตุ:</strong> {currentJob.specialInstructions}</div>
            )}
          </div>
          
          <div className="flex gap-2 mt-4">
            {currentJob.status === 'assigned' && (
              <button
                onClick={() => updateJobStatus(currentJob.id, 'in_progress')}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg"
              >
                เริ่มงาน
              </button>
            )}
            {currentJob.status === 'in_progress' && (
              <button
                onClick={() => updateJobStatus(currentJob.id, 'completed')}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg"
              >
                งานเสร็จ
              </button>
            )}
            <button className="flex-1 bg-gray-500 text-white py-2 rounded-lg">
              นำทาง
            </button>
          </div>
        </div>
      )}

      {/* Schedule Summary */}
      {schedule && (
        <div className="bg-white m-4 rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">สรุปงานวันนี้</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{schedule.jobs.length}</div>
              <div className="text-sm text-gray-600">งานทั้งหมด</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">฿{schedule.estimatedEarnings}</div>
              <div className="text-sm text-gray-600">รายได้คาดการณ์</div>
            </div>
          </div>
          
          <div className="space-y-2">
            {schedule.jobs.map((job: any, index: number) => (
              <div
                key={job.id}
                className={`p-3 border rounded-lg cursor-pointer ${
                  currentJob?.id === job.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setCurrentJob(job)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{job.orderId}</div>
                    <div className="text-sm text-gray-600">{job.timeSlot}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                    <div className={`text-sm font-medium ${getPriorityColor(job.priority)}`}>
                      {job.priority}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!schedule && (
        <div className="m-4 p-8 text-center text-gray-500">
          <div className="text-4xl mb-2">📅</div>
          <div>ไม่มีงานในวันที่เลือก</div>
        </div>
      )}
      {/* Vehicle Selection Modal */}
      {showVehicleSelection && (
        <VehicleSelection
          driverId={driverId}
          jobId={selectedJobId}
          onVehicleSelect={handleVehicleSelect}
          onCancel={() => {
            setShowVehicleSelection(false);
            setSelectedJobId('');
          }}
        />
      )}
    </div>
  );
}