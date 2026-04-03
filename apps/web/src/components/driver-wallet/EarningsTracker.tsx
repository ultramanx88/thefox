'use client';

import { useState } from 'react';
import { useWalletStore } from '@/lib/wallet-manager';

export default function EarningsTracker() {
  const { transactions, dailyEarnings, getEarningsStats } = useWalletStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const stats = getEarningsStats();

  const getEarningsByHour = () => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      earnings: 0,
      orders: 0
    }));

    transactions
      .filter(t => t.type === 'earning' && t.createdAt.toISOString().split('T')[0] === selectedDate)
      .forEach(t => {
        const hour = t.createdAt.getHours();
        hourlyData[hour].earnings += t.amount;
        hourlyData[hour].orders += 1;
      });

    return hourlyData;
  };

  const hourlyData = getEarningsByHour();
  const maxEarnings = Math.max(...hourlyData.map(h => h.earnings));

  const getPerformanceMetrics = () => {
    const earningTransactions = transactions.filter(t => t.type === 'earning');
    const totalOrders = earningTransactions.length;
    const totalEarnings = earningTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgPerOrder = totalOrders > 0 ? totalEarnings / totalOrders : 0;

    const todayOrders = earningTransactions.filter(t => 
      t.createdAt.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
    ).length;

    return {
      totalOrders,
      avgPerOrder,
      todayOrders,
      efficiency: todayOrders > 0 ? (stats.today / todayOrders) : 0
    };
  };

  const metrics = getPerformanceMetrics();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ติดตามรายได้</h1>
        <p className="text-gray-600">วิเคราะห์รายได้และประสิทธิภาพการทำงาน</p>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">ออเดอร์วันนี้</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.todayOrders}</p>
            </div>
            <div className="text-3xl">📦</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">เฉลี่ยต่อออเดอร์</p>
              <p className="text-2xl font-bold text-green-600">฿{metrics.avgPerOrder.toFixed(0)}</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">ออเดอร์รวม</p>
              <p className="text-2xl font-bold text-purple-600">{metrics.totalOrders}</p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">ประสิทธิภาพ</p>
              <p className="text-2xl font-bold text-orange-600">฿{metrics.efficiency.toFixed(0)}/ชม.</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">สรุปรายได้</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-600 text-sm font-medium">วันนี้</p>
            <p className="text-2xl font-bold text-blue-700">฿{stats.today.toLocaleString()}</p>
            <p className="text-sm text-blue-600 mt-1">+12% จากเมื่อวาน</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-green-600 text-sm font-medium">สัปดาห์นี้</p>
            <p className="text-2xl font-bold text-green-700">฿{stats.thisWeek.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-1">+8% จากสัปดาห์ก่อน</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-purple-600 text-sm font-medium">เดือนนี้</p>
            <p className="text-2xl font-bold text-purple-700">฿{stats.thisMonth.toLocaleString()}</p>
            <p className="text-sm text-purple-600 mt-1">+15% จากเดือนก่อน</p>
          </div>
        </div>
      </div>

      {/* Hourly Earnings Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">รายได้รายชั่วโมง</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-12 gap-2 mb-4">
          {hourlyData.map((data, index) => (
            <div key={index} className="text-center">
              <div className="h-32 flex items-end justify-center mb-2">
                <div
                  className="bg-blue-500 rounded-t w-full min-h-[4px] relative group cursor-pointer"
                  style={{
                    height: maxEarnings > 0 ? `${(data.earnings / maxEarnings) * 120}px` : '4px'
                  }}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ฿{data.earnings.toFixed(0)}<br/>
                    {data.orders} ออเดอร์
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600">{data.hour}:00</p>
              <p className="text-xs font-medium">฿{data.earnings.toFixed(0)}</p>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-gray-600">
          รายได้สูงสุด: {Math.max(...hourlyData.map(h => h.hour))}:00 น. (฿{Math.max(...hourlyData.map(h => h.earnings)).toFixed(0)})
        </div>
      </div>

      {/* Peak Hours Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">ช่วงเวลาทำเงิน</h3>
          <div className="space-y-3">
            {[
              { time: '11:00-14:00', label: 'มื้อกลางวัน', earnings: 450, color: 'bg-green-500' },
              { time: '17:00-21:00', label: 'มื้อเย็น', earnings: 680, color: 'bg-blue-500' },
              { time: '21:00-23:00', label: 'ของหวาน/เครื่องดื่ม', earnings: 280, color: 'bg-purple-500' }
            ].map((period, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${period.color}`} />
                  <div>
                    <p className="font-medium">{period.time}</p>
                    <p className="text-sm text-gray-600">{period.label}</p>
                  </div>
                </div>
                <p className="font-semibold text-green-600">฿{period.earnings}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">เป้าหมายรายได้</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>เป้าหมายวันนี้</span>
                <span>{stats.today}/500 บาท</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.min((stats.today / 500) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>เป้าหมายสัปดาห์</span>
                <span>{stats.thisWeek}/3500 บาท</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min((stats.thisWeek / 3500) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>เป้าหมายเดือน</span>
                <span>{stats.thisMonth}/15000 บาท</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${Math.min((stats.thisMonth / 15000) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tips and Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">💡 เคล็ดลับเพิ่มรายได้</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-blue-600 mb-2">ช่วงเวลาทอง</h4>
            <p className="text-sm text-gray-600">ทำงานในช่วง 11:00-14:00 และ 17:00-21:00 เพื่อรายได้สูงสุด</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-green-600 mb-2">เพิ่มประสิทธิภาพ</h4>
            <p className="text-sm text-gray-600">รับออเดอร์ในพื้นที่ใกล้เคียงเพื่อลดเวลาเดินทาง</p>
          </div>
        </div>
      </div>
    </div>
  );
}