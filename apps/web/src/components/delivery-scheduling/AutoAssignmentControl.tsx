'use client';

import { useState, useEffect } from 'react';
import { continuousAssignmentManager } from '@/lib/delivery-scheduling/continuous-assignment';

export default function AutoAssignmentControl() {
  const [settings, setSettings] = useState<any>(null);
  const [queueStatus, setQueueStatus] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    const interval = setInterval(loadSettings, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSettings = () => {
    setSettings(continuousAssignmentManager.getSettings());
    setQueueStatus(continuousAssignmentManager.getQueueStatus());
  };

  const toggleAutoAssignment = () => {
    const newEnabled = !settings.enabled;
    continuousAssignmentManager.toggleAutoAssignment(newEnabled);
    loadSettings();
  };

  const updateSetting = (key: string, value: any) => {
    continuousAssignmentManager.updateSettings({ [key]: value });
    loadSettings();
  };

  const forceProcess = () => {
    continuousAssignmentManager.forceProcessQueue();
    loadSettings();
  };

  if (!settings || !queueStatus) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">การจ่ายงานอัตโนมัติ</h2>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm ${
            settings.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {settings.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
          </span>
          <button
            onClick={toggleAutoAssignment}
            className={`px-4 py-2 rounded-lg font-medium ${
              settings.enabled 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {settings.enabled ? 'ปิด' : 'เปิด'}
          </button>
        </div>
      </div>

      {/* Queue Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{queueStatus.queueLength}</div>
          <div className="text-sm text-gray-600">งานในคิว</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {queueStatus.isProcessing ? 'กำลังประมวลผล' : 'พร้อม'}
          </div>
          <div className="text-sm text-gray-600">สถานะ</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-sm font-bold text-green-600">
            {new Date(queueStatus.lastProcessed).toLocaleTimeString('th-TH')}
          </div>
          <div className="text-sm text-gray-600">ประมวลผลล่าสุด</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <button
            onClick={forceProcess}
            disabled={queueStatus.isProcessing}
            className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 disabled:opacity-50"
          >
            ประมวลผลทันที
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">การตั้งค่า</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">งานสูงสุดต่อคนส่ง</label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.maxJobsPerDriver}
              onChange={(e) => updateSetting('maxJobsPerDriver', parseInt(e.target.value))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">ช่วงเวลาระหว่างงาน (นาที)</label>
            <input
              type="number"
              min="5"
              max="60"
              value={settings.timeBuffer}
              onChange={(e) => updateSetting('timeBuffer', parseInt(e.target.value))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">น้ำหนักการคำนวณ</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">ระยะทาง ({(settings.priorityWeights.distance * 100).toFixed(0)}%)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.priorityWeights.distance}
                onChange={(e) => updateSetting('priorityWeights', {
                  ...settings.priorityWeights,
                  distance: parseFloat(e.target.value)
                })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">คะแนน ({(settings.priorityWeights.rating * 100).toFixed(0)}%)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.priorityWeights.rating}
                onChange={(e) => updateSetting('priorityWeights', {
                  ...settings.priorityWeights,
                  rating: parseFloat(e.target.value)
                })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">ภาระงาน ({(settings.priorityWeights.workload * 100).toFixed(0)}%)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.priorityWeights.workload}
                onChange={(e) => updateSetting('priorityWeights', {
                  ...settings.priorityWeights,
                  workload: parseFloat(e.target.value)
                })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">เวลาเริ่มงาน</label>
            <input
              type="time"
              value={settings.workingHours.start}
              onChange={(e) => updateSetting('workingHours', {
                ...settings.workingHours,
                start: e.target.value
              })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">เวลาเลิกงาน</label>
            <input
              type="time"
              value={settings.workingHours.end}
              onChange={(e) => updateSetting('workingHours', {
                ...settings.workingHours,
                end: e.target.value
              })}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="text-lg font-semibold mb-3">การจัดการคิว</h3>
        <div className="flex gap-2">
          <button
            onClick={() => continuousAssignmentManager.clearQueue()}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            ล้างคิว
          </button>
          <button
            onClick={() => continuousAssignmentManager.startContinuousAssignment()}
            disabled={settings.enabled}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            เริ่มการจ่ายงานต่อเนื่อง
          </button>
          <button
            onClick={() => continuousAssignmentManager.stopContinuousAssignment()}
            disabled={!settings.enabled}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            หยุดการจ่ายงานต่อเนื่อง
          </button>
        </div>
      </div>
    </div>
  );
}