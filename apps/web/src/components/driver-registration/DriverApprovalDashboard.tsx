'use client';

import { useState, useEffect } from 'react';
import { driverRegistrationManager } from '@/lib/driver-registration/driver-registration-manager';

export default function DriverApprovalDashboard() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRegistrations(driverRegistrationManager.getPendingRegistrations());
    setStats(driverRegistrationManager.getRegistrationStats());
  };

  const approveDriver = (id: string) => {
    driverRegistrationManager.approveRegistration(id, reviewNotes);
    setReviewNotes('');
    setSelectedRegistration(null);
    loadData();
  };

  const rejectDriver = (id: string) => {
    if (!reviewNotes.trim()) {
      alert('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }
    driverRegistrationManager.rejectRegistration(id, reviewNotes);
    setReviewNotes('');
    setSelectedRegistration(null);
    loadData();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      document_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">อนุมัติการลงทะเบียนคนขับ</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">ทั้งหมด</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">รอตรวจสอบ</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.documentReview}</div>
            <div className="text-sm text-gray-600">ตรวจเอกสาร</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">อนุมัติแล้ว</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">ปฏิเสธ</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Registration List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">รายการรอการอนุมัติ</h2>
            
            {registrations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">ไม่มีใบสมัครที่รอการอนุมัติ</p>
            ) : (
              <div className="space-y-4">
                {registrations.map(reg => (
                  <div
                    key={reg.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedRegistration?.id === reg.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedRegistration(reg)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{reg.personalInfo.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(reg.status)}`}>
                          {reg.status}
                        </span>
                        <span className={`font-bold ${getScoreColor(reg.score)}`}>
                          {reg.score}/100
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>📧 {reg.personalInfo.email}</div>
                      <div>📱 {reg.personalInfo.phone}</div>
                      <div>🏍️ {reg.vehicleInfo.type} - {reg.vehicleInfo.licensePlate}</div>
                      <div>📅 {new Date(reg.submittedAt).toLocaleDateString('th-TH')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {selectedRegistration ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">รายละเอียดใบสมัคร</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">ข้อมูลส่วนตัว</h3>
                    <div className="text-sm space-y-1">
                      <div>ชื่อ: {selectedRegistration.personalInfo.name}</div>
                      <div>อีเมล: {selectedRegistration.personalInfo.email}</div>
                      <div>เบอร์โทร: {selectedRegistration.personalInfo.phone}</div>
                      <div>บัตรประชาชน: {selectedRegistration.personalInfo.idCard}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">ข้อมูลยานพาหนะ</h3>
                    <div className="text-sm space-y-1">
                      <div>ประเภท: {selectedRegistration.vehicleInfo.type}</div>
                      <div>ทะเบียน: {selectedRegistration.vehicleInfo.licensePlate}</div>
                      <div>ยี่ห้อ: {selectedRegistration.vehicleInfo.brand}</div>
                      <div>รุ่น: {selectedRegistration.vehicleInfo.model}</div>
                      <div>ปี: {selectedRegistration.vehicleInfo.year}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">เอกสาร</h3>
                    <div className="text-sm space-y-1">
                      {Object.entries(selectedRegistration.documents).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key}:</span>
                          <span className={value ? 'text-green-600' : 'text-red-600'}>
                            {value ? '✓' : '✗'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">คะแนนประเมิน</h3>
                    <div className={`text-2xl font-bold ${getScoreColor(selectedRegistration.score)}`}>
                      {selectedRegistration.score}/100
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">หมายเหตุ</label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="w-full p-2 border rounded-lg"
                      rows={3}
                      placeholder="เหตุผลในการอนุมัติ/ปฏิเสธ"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => approveDriver(selectedRegistration.id)}
                      className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                    >
                      อนุมัติ
                    </button>
                    <button
                      onClick={() => rejectDriver(selectedRegistration.id)}
                      className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                    >
                      ปฏิเสธ
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">👆</div>
                <p>เลือกใบสมัครเพื่อดูรายละเอียด</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}