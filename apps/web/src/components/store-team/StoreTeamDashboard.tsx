'use client';

import { useState, useEffect } from 'react';
import { storeTeamManager } from '@/lib/store-team/team-manager';

export default function StoreTeamDashboard() {
  const [storeId] = useState('store_001');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAssignOrder, setShowAssignOrder] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'packer' as const,
    isActive: true
  });
  const [newOrder, setNewOrder] = useState({
    orderId: '',
    priority: 'medium' as const,
    assignedTo: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTeamMembers(storeTeamManager.getTeamMembers(storeId));
    setActiveOrders(storeTeamManager.getActiveOrders(storeId));
    setStats(storeTeamManager.getTeamStats(storeId));
  };

  const addMember = () => {
    storeTeamManager.addTeamMember(storeId, newMember);
    setNewMember({ name: '', email: '', phone: '', role: 'packer', isActive: true });
    setShowAddMember(false);
    loadData();
  };

  const assignOrder = () => {
    if (newOrder.orderId && newOrder.assignedTo.length > 0) {
      storeTeamManager.assignOrder(storeId, newOrder.orderId, newOrder.assignedTo, newOrder.priority);
      setNewOrder({ orderId: '', priority: 'medium', assignedTo: [] });
      setShowAssignOrder(false);
      loadData();
    }
  };

  const updateOrderStatus = (assignmentId: string, status: string) => {
    storeTeamManager.updateOrderStatus(storeId, assignmentId, status as any);
    loadData();
  };

  const toggleMemberSelection = (memberId: string) => {
    setNewOrder(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(memberId)
        ? prev.assignedTo.filter(id => id !== memberId)
        : [...prev.assignedTo, memberId]
    }));
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

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">จัดการทีมงานร้าน</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddMember(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              เพิ่มทีมงาน
            </button>
            <button
              onClick={() => setShowAssignOrder(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              มอบหมายงาน
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalMembers}</div>
            <div className="text-sm text-gray-600">ทีมงานทั้งหมด</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeMembers}</div>
            <div className="text-sm text-gray-600">ทำงานอยู่</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
            <div className="text-sm text-gray-600">งานรอดำเนินการ</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgressOrders}</div>
            <div className="text-sm text-gray-600">กำลังดำเนินการ</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.completedToday}</div>
            <div className="text-sm text-gray-600">เสร็จวันนี้</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Members */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">ทีมงาน</h2>
            
            {teamMembers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">ยังไม่มีทีมงาน</p>
            ) : (
              <div className="space-y-3">
                {teamMembers.map(member => (
                  <div key={member.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{member.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.isActive ? 'ทำงาน' : 'หยุด'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>ตำแหน่ง: {storeTeamManager.getRoleDisplayName(member.role)}</div>
                      <div>📧 {member.email}</div>
                      <div>📱 {member.phone}</div>
                      <div>งานที่เสร็จ: {member.performance.ordersCompleted}</div>
                      <div>คะแนน: ⭐ {member.performance.rating.toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Orders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">งานที่มอบหมาย</h2>
            
            {activeOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">ไม่มีงานที่มอบหมาย</p>
            ) : (
              <div className="space-y-3">
                {activeOrders.map(order => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Order #{order.orderId}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <div>มอบหมายให้: {order.assignedTo.map((id: string) => {
                        const member = teamMembers.find(m => m.id === id);
                        return member?.name;
                      }).join(', ')}</div>
                      <div>เวลา: {new Date(order.assignedAt).toLocaleString('th-TH')}</div>
                    </div>

                    {order.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateOrderStatus(order.id, 'in_progress')}
                          className="flex-1 bg-blue-500 text-white py-1 px-2 rounded text-sm hover:bg-blue-600"
                        >
                          เริ่มงาน
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="flex-1 bg-red-500 text-white py-1 px-2 rounded text-sm hover:bg-red-600"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    )}

                    {order.status === 'in_progress' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="w-full bg-green-500 text-white py-1 px-2 rounded text-sm hover:bg-green-600"
                      >
                        เสร็จสิ้น
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">เพิ่มทีมงานใหม่</h2>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="ชื่อ-นามสกุล"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
                <input
                  type="email"
                  placeholder="อีเมล"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
                <input
                  type="tel"
                  placeholder="เบอร์โทร"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({...newMember, role: e.target.value as any})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="packer">พนักงานจัดของ</option>
                  <option value="quality_checker">ตรวจสอบคุณภาพ</option>
                  <option value="inventory_manager">จัดการสต็อก</option>
                  <option value="supervisor">หัวหน้างาน</option>
                </select>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={addMember}
                  disabled={!newMember.name || !newMember.email}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  เพิ่ม
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Order Modal */}
        {showAssignOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">มอบหมายงาน</h2>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="รหัสคำสั่งซื้อ"
                  value={newOrder.orderId}
                  onChange={(e) => setNewOrder({...newOrder, orderId: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
                
                <select
                  value={newOrder.priority}
                  onChange={(e) => setNewOrder({...newOrder, priority: e.target.value as any})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="low">ความสำคัญต่ำ</option>
                  <option value="medium">ความสำคัญปานกลาง</option>
                  <option value="high">ความสำคัญสูง</option>
                  <option value="urgent">เร่งด่วน</option>
                </select>

                <div>
                  <label className="block text-sm font-medium mb-2">เลือกทีมงาน</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {teamMembers.filter(m => m.isActive).map(member => (
                      <div
                        key={member.id}
                        className={`p-2 border rounded cursor-pointer ${
                          newOrder.assignedTo.includes(member.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => toggleMemberSelection(member.id)}
                      >
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-600">{storeTeamManager.getRoleDisplayName(member.role)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowAssignOrder(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={assignOrder}
                  disabled={!newOrder.orderId || newOrder.assignedTo.length === 0}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  มอบหมาย
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}