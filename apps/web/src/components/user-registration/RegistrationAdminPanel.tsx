'use client';

import { useState, useEffect } from 'react';
import { userRegistrationManager } from '@/lib/user-registration/registration-manager';

export default function RegistrationAdminPanel() {
  const [stats, setStats] = useState<any>(null);
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);
  const [autoApprovalRules, setAutoApprovalRules] = useState<any>(null);
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setStats(userRegistrationManager.getRegistrationStats());
    setPendingRegistrations(userRegistrationManager.getPendingRegistrations());
    setAutoApprovalRules(userRegistrationManager.getAutoApprovalRules());
  };

  const toggleAutoApproval = () => {
    userRegistrationManager.toggleAutoApproval(!autoApprovalRules.enabled);
    loadData();
  };

  const approveRegistration = (id: string) => {
    userRegistrationManager.manualApprove(id);
    loadData();
  };

  const rejectRegistration = (id: string) => {
    userRegistrationManager.reject(id);
    loadData();
  };

  const bulkApprove = () => {
    userRegistrationManager.bulkApprove(selectedRegistrations);
    setSelectedRegistrations([]);
    loadData();
  };

  const toggleSelection = (id: string) => {
    setSelectedRegistrations(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const updateRule = (key: string, value: any) => {
    userRegistrationManager.updateAutoApprovalRules({ [key]: value });
    loadData();
  };

  if (!stats || !autoApprovalRules) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">จัดการการลงทะเบียน</h1>

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
            <div className="text-2xl font-bold text-purple-600">{stats.todayAutoApproved}</div>
            <div className="text-sm text-gray-600">อนุมัติอัตโนมัติวันนี้</div>
          </div>
        </div>

        {/* Auto Approval Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">การอนุมัติอัตโนมัติ</h2>
            <button
              onClick={toggleAutoApproval}
              className={`px-4 py-2 rounded-lg font-medium ${
                autoApprovalRules.enabled 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {autoApprovalRules.enabled ? 'ปิด' : 'เปิด'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">จำนวนสูงสุดต่อวัน</label>
              <input
                type="number"
                value={autoApprovalRules.maxAutoApprovalsPerDay}
                onChange={(e) => updateRule('maxAutoApprovalsPerDay', parseInt(e.target.value))}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">โดเมนอีเมลที่อนุญาต</label>
              <input
                type="text"
                value={autoApprovalRules.emailDomains.join(', ')}
                onChange={(e) => updateRule('emailDomains', e.target.value.split(', '))}
                className="w-full p-2 border rounded-lg"
                placeholder="gmail.com, hotmail.com"
              />
            </div>
          </div>
        </div>

        {/* Pending Registrations */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">รอการอนุมัติ ({pendingRegistrations.length})</h2>
            {selectedRegistrations.length > 0 && (
              <button
                onClick={bulkApprove}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                อนุมัติที่เลือก ({selectedRegistrations.length})
              </button>
            )}
          </div>

          {pendingRegistrations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">ไม่มีการลงทะเบียนที่รอการอนุมัติ</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRegistrations(pendingRegistrations.map(r => r.id));
                          } else {
                            setSelectedRegistrations([]);
                          }
                        }}
                      />
                    </th>
                    <th className="text-left p-2">ชื่อ</th>
                    <th className="text-left p-2">อีเมล</th>
                    <th className="text-left p-2">เบอร์โทร</th>
                    <th className="text-left p-2">ประเภท</th>
                    <th className="text-left p-2">วันที่สมัคร</th>
                    <th className="text-left p-2">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRegistrations.map(registration => (
                    <tr key={registration.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedRegistrations.includes(registration.id)}
                          onChange={() => toggleSelection(registration.id)}
                        />
                      </td>
                      <td className="p-2 font-medium">{registration.name}</td>
                      <td className="p-2">{registration.email}</td>
                      <td className="p-2">{registration.phone}</td>
                      <td className="p-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {registration.userType}
                        </span>
                      </td>
                      <td className="p-2 text-sm text-gray-600">
                        {new Date(registration.submittedAt).toLocaleDateString('th-TH')}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveRegistration(registration.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            อนุมัติ
                          </button>
                          <button
                            onClick={() => rejectRegistration(registration.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            ปฏิเสธ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}