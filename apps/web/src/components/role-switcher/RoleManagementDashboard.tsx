'use client';

import { useState, useEffect } from 'react';
import { roleSwitcherManager } from '@/lib/role-switcher/role-manager';

export default function RoleManagementDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [allRoles] = useState([
    { id: 'customer', name: 'ลูกค้า', icon: '👤' },
    { id: 'driver', name: 'คนส่งของ', icon: '🏍️' },
    { id: 'business', name: 'ลูกค้าธุรกิจ', icon: '🏢' },
    { id: 'admin', name: 'ผู้ดูแลระบบ', icon: '⚙️' },
    { id: 'store_owner', name: 'เจ้าของร้าน', icon: '🏪' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCurrentUser(roleSwitcherManager.getCurrentUser());
    setAvailableRoles(roleSwitcherManager.getAvailableRoles());
  };

  const addRole = (roleId: string) => {
    const success = roleSwitcherManager.addRoleToUser(roleId);
    if (success) {
      loadData();
    }
  };

  const removeRole = (roleId: string) => {
    const success = roleSwitcherManager.removeRoleFromUser(roleId);
    if (success) {
      loadData();
    }
  };

  const hasRole = (roleId: string) => {
    return currentUser?.availableRoles.includes(roleId);
  };

  if (!currentUser) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">จัดการบทบาทผู้ใช้งาน</h1>

        {/* Current User Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">ข้อมูลผู้ใช้งาน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">ชื่อ</label>
              <p className="text-lg font-medium">{currentUser.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">อีเมล</label>
              <p className="text-lg">{currentUser.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">บทบาทปัจจุบัน</label>
              <div className="flex items-center gap-2">
                <span className="text-lg">{roleSwitcherManager.getCurrentRole().icon}</span>
                <span className="font-medium">{roleSwitcherManager.getCurrentRole().name}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">จำนวนบทบาท</label>
              <p className="text-lg font-medium">{currentUser.availableRoles.length} บทบาท</p>
            </div>
          </div>
        </div>

        {/* Role Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">จัดการบทบาท</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allRoles.map(role => {
              const userHasRole = hasRole(role.id);
              const isCurrentRole = currentUser.currentRole === role.id;
              
              return (
                <div
                  key={role.id}
                  className={`border-2 rounded-lg p-4 transition-colors ${
                    userHasRole 
                      ? isCurrentRole 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{role.icon}</span>
                      <h3 className="font-semibold">{role.name}</h3>
                    </div>
                    {isCurrentRole && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        ปัจจุบัน
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {userHasRole ? (
                      <button
                        onClick={() => removeRole(role.id)}
                        disabled={currentUser.availableRoles.length <= 1}
                        className="flex-1 bg-red-500 text-white py-2 px-3 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        ลบบทบาท
                      </button>
                    ) : (
                      <button
                        onClick={() => addRole(role.id)}
                        className="flex-1 bg-green-500 text-white py-2 px-3 rounded hover:bg-green-600 text-sm"
                      >
                        เพิ่มบทบาท
                      </button>
                    )}
                  </div>
                  
                  {userHasRole && (
                    <div className="mt-2 text-xs text-gray-600">
                      สิทธิ์: {roleSwitcherManager.roles?.[role.id]?.permissions.length || 0} รายการ
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Permissions */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">สิทธิ์การใช้งานปัจจุบัน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {roleSwitcherManager.getCurrentRole().permissions.map(permission => (
              <div
                key={permission}
                className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm"
              >
                {permission}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">การดำเนินการด่วน</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.location.href = roleSwitcherManager.getRoleDashboardUrl()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              ไปยังแดชบอร์ดปัจจุบัน
            </button>
            
            {availableRoles.map(role => (
              <button
                key={role.id}
                onClick={() => {
                  roleSwitcherManager.switchRole(role.id);
                  loadData();
                }}
                className={`px-4 py-2 rounded-lg border ${
                  currentUser.currentRole === role.id
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                disabled={currentUser.currentRole === role.id}
              >
                {role.icon} สลับเป็น {role.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}