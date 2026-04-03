'use client';

import { useState } from 'react';

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    orderUpdates: {
      push: true,
      sms: true,
      email: false,
      line: true
    },
    deliveryAlerts: {
      push: true,
      sms: true,
      email: false,
      line: false
    },
    promotions: {
      push: false,
      sms: false,
      email: true,
      line: true
    },
    chat: {
      push: true,
      sms: false,
      email: false,
      line: false
    },
    system: {
      push: true,
      sms: false,
      email: true,
      line: false
    }
  });

  const [scheduleSettings, setScheduleSettings] = useState({
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '07:00'
    },
    weekendNotifications: true,
    urgentOnly: false
  });

  const updateSetting = (category: string, channel: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [channel]: value
      }
    }));
  };

  const updateScheduleSetting = (key: string, value: any) => {
    setScheduleSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const categories = [
    { key: 'orderUpdates', name: 'อัปเดตคำสั่งซื้อ', icon: '📦' },
    { key: 'deliveryAlerts', name: 'การแจ้งเตือนการส่ง', icon: '🚚' },
    { key: 'promotions', name: 'โปรโมชั่น', icon: '🎁' },
    { key: 'chat', name: 'ข้อความแชท', icon: '💬' },
    { key: 'system', name: 'ระบบ', icon: '⚙️' }
  ];

  const channels = [
    { key: 'push', name: 'Push Notification', icon: '📱' },
    { key: 'sms', name: 'SMS', icon: '📱' },
    { key: 'email', name: 'Email', icon: '📧' },
    { key: 'line', name: 'Line', icon: '💚' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ตั้งค่าการแจ้งเตือน</h1>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">ช่องทางการแจ้งเตือน</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">ประเภท</th>
                {channels.map(channel => (
                  <th key={channel.key} className="text-center py-3 px-2">
                    <div className="flex flex-col items-center">
                      <span className="text-lg mb-1">{channel.icon}</span>
                      <span className="text-sm">{channel.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.key} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </td>
                  {channels.map(channel => (
                    <td key={channel.key} className="text-center py-4 px-2">
                      <input
                        type="checkbox"
                        checked={settings[category.key as keyof typeof settings][channel.key as keyof typeof settings.orderUpdates]}
                        onChange={(e) => updateSetting(category.key, channel.key, e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">ตั้งค่าเวลา</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">โหมดเงียบ</h3>
              <p className="text-sm text-gray-600">ปิดการแจ้งเตือนในช่วงเวลาที่กำหนด</p>
            </div>
            <input
              type="checkbox"
              checked={scheduleSettings.quietHours.enabled}
              onChange={(e) => updateScheduleSetting('quietHours', {
                ...scheduleSettings.quietHours,
                enabled: e.target.checked
              })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>

          {scheduleSettings.quietHours.enabled && (
            <div className="ml-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">เริ่ม</label>
                <input
                  type="time"
                  value={scheduleSettings.quietHours.start}
                  onChange={(e) => updateScheduleSetting('quietHours', {
                    ...scheduleSettings.quietHours,
                    start: e.target.value
                  })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">สิ้นสุด</label>
                <input
                  type="time"
                  value={scheduleSettings.quietHours.end}
                  onChange={(e) => updateScheduleSetting('quietHours', {
                    ...scheduleSettings.quietHours,
                    end: e.target.value
                  })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">การแจ้งเตือนในวันหยุด</h3>
              <p className="text-sm text-gray-600">รับการแจ้งเตือนในวันเสาร์-อาทิตย์</p>
            </div>
            <input
              type="checkbox"
              checked={scheduleSettings.weekendNotifications}
              onChange={(e) => updateScheduleSetting('weekendNotifications', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">เฉพาะเร่งด่วน</h3>
              <p className="text-sm text-gray-600">แจ้งเตือนเฉพาะข้อความสำคัญในโหมดเงียบ</p>
            </div>
            <input
              type="checkbox"
              checked={scheduleSettings.urgentOnly}
              onChange={(e) => updateScheduleSetting('urgentOnly', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">การดำเนินการด่วน</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              // Enable all notifications
              const allEnabled = Object.keys(settings).reduce((acc, category) => ({
                ...acc,
                [category]: { push: true, sms: true, email: true, line: true }
              }), {});
              setSettings(allEnabled);
            }}
            className="p-4 border-2 border-green-500 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
          >
            <div className="text-2xl mb-2">🔔</div>
            <div className="font-medium">เปิดทั้งหมด</div>
            <div className="text-sm">เปิดการแจ้งเตือนทุกช่องทาง</div>
          </button>

          <button
            onClick={() => {
              // Disable all notifications
              const allDisabled = Object.keys(settings).reduce((acc, category) => ({
                ...acc,
                [category]: { push: false, sms: false, email: false, line: false }
              }), {});
              setSettings(allDisabled);
            }}
            className="p-4 border-2 border-red-500 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            <div className="text-2xl mb-2">🔕</div>
            <div className="font-medium">ปิดทั้งหมด</div>
            <div className="text-sm">ปิดการแจ้งเตือนทุกช่องทาง</div>
          </button>

          <button
            onClick={() => {
              // Essential only
              setSettings({
                orderUpdates: { push: true, sms: true, email: false, line: false },
                deliveryAlerts: { push: true, sms: true, email: false, line: false },
                promotions: { push: false, sms: false, email: false, line: false },
                chat: { push: true, sms: false, email: false, line: false },
                system: { push: true, sms: false, email: false, line: false }
              });
            }}
            className="p-4 border-2 border-blue-500 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <div className="text-2xl mb-2">⚡</div>
            <div className="font-medium">เฉพาะสำคัญ</div>
            <div className="text-sm">เปิดเฉพาะการแจ้งเตือนสำคัญ</div>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 text-center">
        <button className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 font-medium">
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}