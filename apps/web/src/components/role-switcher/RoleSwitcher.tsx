'use client';

import { useState, useEffect } from 'react';
import { roleSwitcherManager } from '@/lib/role-switcher/role-manager';
import { useRouter } from 'next/navigation';

export default function RoleSwitcher() {
  const [currentRole, setCurrentRole] = useState<any>(null);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    roleSwitcherManager.loadFromStorage();
    loadRoles();
  }, []);

  const loadRoles = () => {
    setCurrentRole(roleSwitcherManager.getCurrentRole());
    setAvailableRoles(roleSwitcherManager.getAvailableRoles());
  };

  const switchRole = (roleId: string) => {
    const success = roleSwitcherManager.switchRole(roleId);
    if (success) {
      loadRoles();
      setIsOpen(false);
      
      // Navigate to role dashboard
      const dashboardUrl = roleSwitcherManager.getRoleDashboardUrl();
      router.push(dashboardUrl);
    }
  };

  if (!currentRole) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 hover:bg-gray-50 shadow-sm"
      >
        <span className="text-lg">{currentRole.icon}</span>
        <span className="font-medium">{currentRole.name}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-20">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-gray-800">เปลี่ยนบทบาท</h3>
              <p className="text-sm text-gray-600">เลือกบทบาทที่ต้องการใช้งาน</p>
            </div>
            
            <div className="py-2">
              {availableRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => switchRole(role.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    currentRole.id === role.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <span className="text-xl">{role.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{role.name}</div>
                    <div className="text-sm text-gray-500">
                      {role.permissions.length} สิทธิ์
                    </div>
                  </div>
                  {currentRole.id === role.id && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="p-3 border-t bg-gray-50">
              <div className="text-xs text-gray-600">
                บทบาทปัจจุบัน: <span className="font-medium">{currentRole.name}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}