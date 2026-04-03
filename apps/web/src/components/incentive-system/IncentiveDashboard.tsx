'use client';

import { useState } from 'react';
import { useIncentiveStore, IncentiveManager } from '@/lib/incentive-manager';

export default function IncentiveDashboard() {
  const { 
    achievements, 
    bonuses, 
    currentStreak, 
    totalBonusEarned,
    checkAchievements 
  } = useIncentiveStore();

  const [activeTab, setActiveTab] = useState<'achievements' | 'bonuses' | 'challenges'>('achievements');

  const completedAchievements = achievements.filter(a => a.isCompleted);
  const inProgressAchievements = achievements.filter(a => !a.isCompleted);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ระบบอินเซนทีฟ</h1>
        <p className="text-gray-600">รับโบนัสและปลดล็อกความสำเร็จ</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">โบนัสรวม</p>
              <p className="text-2xl font-bold">฿{totalBonusEarned.toLocaleString()}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">ความสำเร็จ</p>
              <p className="text-2xl font-bold">{completedAchievements.length}/{achievements.length}</p>
            </div>
            <div className="text-3xl">🏆</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">สตรีคปัจจุบัน</p>
              <p className="text-2xl font-bold">{currentStreak} วัน</p>
            </div>
            <div className="text-3xl">🔥</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">โบนัสวันนี้</p>
              <p className="text-2xl font-bold">฿{bonuses.filter(b => 
                b.earnedAt.toDateString() === new Date().toDateString()
              ).reduce((sum, b) => sum + b.amount, 0)}</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <nav className="flex">
            {[
              { key: 'achievements', label: 'ความสำเร็จ', icon: '🏆' },
              { key: 'bonuses', label: 'โบนัส', icon: '💰' },
              { key: 'challenges', label: 'ภารกิจ', icon: '🎯' }
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
          {activeTab === 'achievements' && (
            <div className="space-y-6">
              {/* In Progress Achievements */}
              <div>
                <h3 className="text-lg font-semibold mb-4">กำลังดำเนินการ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inProgressAchievements.map((achievement) => (
                    <div key={achievement.id} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">{achievement.title}</h4>
                          <p className="text-gray-600 text-sm mb-3">{achievement.description}</p>
                          
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>ความคืบหน้า</span>
                              <span>{achievement.current}/{achievement.target}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${IncentiveManager.getAchievementProgress(achievement.current, achievement.target)}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-green-600 font-semibold">รางวัล: ฿{achievement.reward}</span>
                            <span className="text-xs text-gray-500">
                              {Math.round(IncentiveManager.getAchievementProgress(achievement.current, achievement.target))}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completed Achievements */}
              {completedAchievements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">สำเร็จแล้ว</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {completedAchievements.map((achievement) => (
                      <div key={achievement.id} className="border rounded-xl p-4 bg-green-50 border-green-200">
                        <div className="text-center">
                          <div className="text-3xl mb-2">{achievement.icon}</div>
                          <h4 className="font-semibold mb-1">{achievement.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                          <div className="text-green-600 font-semibold">✓ ฿{achievement.reward}</div>
                          {achievement.completedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {achievement.completedAt.toLocaleDateString('th-TH')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bonuses' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">ประวัติโบนัส</h3>
                <select className="border rounded-lg px-3 py-2">
                  <option>ทั้งหมด</option>
                  <option>ช่วงเวลาเร่งด่วน</option>
                  <option>สภาพอากาศ</option>
                  <option>คะแนน</option>
                  <option>ระยะทาง</option>
                </select>
              </div>
              
              <div className="space-y-3">
                {bonuses.map((bonus) => (
                  <div key={bonus.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{IncentiveManager.getBonusIcon(bonus.type)}</span>
                      <div>
                        <p className="font-medium">{bonus.description}</p>
                        <p className="text-sm text-gray-600">
                          {bonus.earnedAt.toLocaleDateString('th-TH')} {bonus.earnedAt.toLocaleTimeString('th-TH')}
                        </p>
                        {bonus.orderId && (
                          <p className="text-xs text-blue-600">Order: {bonus.orderId}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+฿{bonus.amount}</p>
                      {bonus.multiplier && (
                        <p className="text-xs text-gray-500">{bonus.multiplier}x</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'challenges' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">ภารกิจรายวัน</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'ส่งอาหาร 5 ออเดอร์', progress: 3, target: 5, reward: 50, icon: '📦' },
                    { title: 'รักษาเรตติ้ง 4.5+', progress: 4.8, target: 4.5, reward: 30, icon: '⭐' },
                    { title: 'ทำงานช่วงเร่งด่วน 2 ชั่วโมง', progress: 1, target: 2, reward: 40, icon: '🔥' }
                  ].map((challenge, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{challenge.icon}</span>
                        <div>
                          <h4 className="font-medium">{challenge.title}</h4>
                          <p className="text-sm text-green-600">รางวัล: ฿{challenge.reward}</p>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>ความคืบหน้า</span>
                          <span>{challenge.progress}/{challenge.target}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">ภารกิจสัปดาห์</h3>
                <div className="space-y-3">
                  {[
                    { title: 'ส่งอาหารครบ 30 ออเดอร์', progress: 18, target: 30, reward: 200, icon: '🎯' },
                    { title: 'ทำงานติดต่อกัน 5 วัน', progress: currentStreak, target: 5, reward: 150, icon: '🏃' }
                  ].map((challenge, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{challenge.icon}</span>
                          <div>
                            <h4 className="font-medium">{challenge.title}</h4>
                            <p className="text-sm text-green-600">รางวัล: ฿{challenge.reward}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{challenge.progress}/{challenge.target}</p>
                          <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">💡 เคล็ดลับเพิ่มโบนัส</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-blue-600 mb-2">ช่วงเวลาทอง</h4>
            <p className="text-sm text-gray-600">ทำงานช่วง 11:00-14:00 และ 17:00-21:00 รับโบนัสสูงสุด 50%</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-green-600 mb-2">คะแนนสูง</h4>
            <p className="text-sm text-gray-600">รักษาเรตติ้ง 4.8+ รับโบนัส 20 บาทต่อออเดอร์</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-purple-600 mb-2">สตรีคยาว</h4>
            <p className="text-sm text-gray-600">ทำงานติดต่อกันรับโบนัสเพิ่มขึ้นทุกวัน</p>
          </div>
        </div>
      </div>
    </div>
  );
}