'use client';

import { useState } from 'react';
import ReviewForm from '@/components/review/ReviewForm';
import ReviewList from '@/components/review/ReviewList';
import RatingDisplay from '@/components/review/RatingDisplay';

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<'write' | 'restaurant' | 'driver'>('restaurant');
  const [selectedTarget, setSelectedTarget] = useState('rest1');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">รีวิวและคะแนน</h1>
        <p className="text-gray-600">แบ่งปันประสบการณ์และดูรีวิวจากผู้ใช้อื่น</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border mb-8">
        <div className="border-b">
          <nav className="flex">
            {[
              { key: 'restaurant', label: 'รีวิวร้านอาหาร', icon: '🍽️' },
              { key: 'driver', label: 'รีวิวคนขับ', icon: '🚗' },
              { key: 'write', label: 'เขียนรีวิว', icon: '✍️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'write' && (
            <div className="max-w-2xl mx-auto">
              <ReviewForm
                orderId="ORD-123"
                restaurantId="rest1"
                driverId="driver1"
                onSubmit={() => {
                  alert('รีวิวถูกส่งเรียบร้อยแล้ว');
                  setActiveTab('restaurant');
                }}
              />
            </div>
          )}

          {activeTab === 'restaurant' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">เลือกร้านอาหาร</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'rest1', name: 'ร้านส้มตำป้าแดง', rating: 4.5, reviews: 128 },
                    { id: 'rest2', name: 'ข้าวผัดกุ้งลุงโจ้', rating: 4.2, reviews: 89 },
                    { id: 'rest3', name: 'ก๋วยเตี๋ยวเรือน้าเอ็ม', rating: 4.8, reviews: 256 }
                  ].map((restaurant) => (
                    <button
                      key={restaurant.id}
                      onClick={() => setSelectedTarget(restaurant.id)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        selectedTarget === restaurant.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <h4 className="font-medium mb-2">{restaurant.name}</h4>
                      <RatingDisplay targetId={restaurant.id} type="restaurant" size="sm" />
                    </button>
                  ))}
                </div>
              </div>
              
              <ReviewList targetId={selectedTarget} type="restaurant" />
            </div>
          )}

          {activeTab === 'driver' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">เลือกคนขับ</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'driver1', name: 'คุณสมชาย', rating: 4.9, reviews: 342 },
                    { id: 'driver2', name: 'คุณสมหญิง', rating: 4.7, reviews: 198 },
                    { id: 'driver3', name: 'คุณสมศักดิ์', rating: 4.6, reviews: 156 }
                  ].map((driver) => (
                    <button
                      key={driver.id}
                      onClick={() => setSelectedTarget(driver.id)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        selectedTarget === driver.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <h4 className="font-medium mb-2">{driver.name}</h4>
                      <RatingDisplay targetId={driver.id} type="driver" size="sm" />
                    </button>
                  ))}
                </div>
              </div>
              
              <ReviewList targetId={selectedTarget} type="driver" />
            </div>
          )}
        </div>
      </div>

      {/* Review Guidelines */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">💡 แนวทางการเขียนรีวิว</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-green-600 mb-2">ควรทำ ✅</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• เขียนรีวิวตามประสบการณ์จริง</li>
              <li>• ให้รายละเอียดที่เป็นประโยชน์</li>
              <li>• ใช้ภาษาสุภาพ</li>
              <li>• แนบรูปภาพประกอบ</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-red-600 mb-2">ไม่ควรทำ ❌</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• เขียนรีวิวปลอมหรือเกินจริง</li>
              <li>• ใช้คำหยาบคายหรือดูหมิ่น</li>
              <li>• เปิดเผยข้อมูลส่วนตัว</li>
              <li>• รีวิวเพื่อแลกผลประโยชน์</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}