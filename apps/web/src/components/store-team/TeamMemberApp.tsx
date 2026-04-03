'use client';

import { useState, useEffect } from 'react';
import { storeTeamManager } from '@/lib/store-team/team-manager';

export default function TeamMemberApp() {
  const [memberId] = useState('member_001'); // In real app, get from auth
  const [storeId] = useState('store_001');
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [memberInfo, setMemberInfo] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allOrders = storeTeamManager.getActiveOrders(storeId);
    const myAssignedOrders = allOrders.filter(order => 
      order.assignedTo.includes(memberId)
    );
    setMyOrders(myAssignedOrders);

    const members = storeTeamManager.getTeamMembers(storeId);
    const member = members.find(m => m.id === memberId);
    setMemberInfo(member);
  };

  const updateOrderStatus = (assignmentId: string, status: string) => {
    storeTeamManager.updateOrderStatus(storeId, assignmentId, status as any);
    loadData();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority: string) => {
    const icons = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      urgent: '🔴'
    };
    return icons[priority as keyof typeof icons] || '⚪';
  };

  if (!memberInfo) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">แอปทีมงานร้าน</h1>
        <p className="text-blue-100">{memberInfo.name} - {storeTeamManager.getRoleDisplayName(memberInfo.role)}</p>
      </div>

      {/* Performance Summary */}
      <div className="bg-white m-4 rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-3">สรุปผลงาน</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{memberInfo.performance.ordersCompleted}</div>
            <div className="text-sm text-gray-600">งานที่เสร็จ</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{memberInfo.performance.rating.toFixed(1)}</div>
            <div className="text-sm text-gray-600">คะแนนเฉลี่ย</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{myOrders.filter(o => o.status === 'pending').length}</div>
            <div className="text-sm text-gray-600">งานรอทำ</div>
          </div>
        </div>
      </div>

      {/* My Orders */}
      <div className="bg-white m-4 rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-4">งานที่ได้รับมอบหมาย</h2>
        
        {myOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>ไม่มีงานที่ได้รับมอบหมาย</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myOrders.map(order => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getPriorityIcon(order.priority)}</span>
                    <h3 className="font-semibold">Order #{order.orderId}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  <div>ความสำคัญ: {order.priority}</div>
                  <div>มอบหมายเมื่อ: {new Date(order.assignedAt).toLocaleString('th-TH')}</div>
                  {order.notes && <div>หมายเหตุ: {order.notes}</div>}
                </div>

                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'in_progress')}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                    >
                      เริ่มทำงาน
                    </button>
                  )}
                  
                  {order.status === 'in_progress' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                    >
                      งานเสร็จ
                    </button>
                  )}
                  
                  {order.status === 'completed' && (
                    <div className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-center">
                      เสร็จสิ้นแล้ว
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white m-4 rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-3">การดำเนินการด่วน</h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600">
            📋 ดูงานทั้งหมด
          </button>
          <button className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600">
            📊 ดูสถิติ
          </button>
          <button className="bg-purple-500 text-white p-3 rounded-lg hover:bg-purple-600">
            💬 แชททีม
          </button>
          <button className="bg-orange-500 text-white p-3 rounded-lg hover:bg-orange-600">
            ❓ ขอความช่วยเหลือ
          </button>
        </div>
      </div>
    </div>
  );
}