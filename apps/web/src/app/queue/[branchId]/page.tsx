'use client';
import { useState } from 'react';
import { useQueue } from '@/hooks/useQueue';
import type { Queue } from '@repo/api/src/types';

export default function CustomerQueuePage({ params }: { params: { branchId: string } }) {
  const { branch, waiting, called, loading, takeQueue } = useQueue(params.branchId);
  const [myQueue, setMyQueue] = useState<Queue | null>(null);
  const [taking, setTaking] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleTake = async () => {
    setTaking(true);
    try {
      const q = await takeQueue({ customerName: name, customerPhone: phone });
      setMyQueue(q);
    } catch (e) {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setTaking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      {/* Branch header */}
      <div className="bg-orange-500 text-white rounded-2xl p-6 mb-6 text-center">
        <h1 className="text-2xl font-bold">{branch?.name ?? 'ระบบคิว'}</h1>
        <p className="text-orange-100 mt-1">
          {branch?.isOpen ? 'เปิดให้บริการ' : 'ปิดให้บริการ'}
        </p>
      </div>

      {/* Current calling */}
      {called.length > 0 && (
        <div className="bg-white rounded-2xl p-6 mb-4 text-center shadow-sm border-2 border-orange-200">
          <p className="text-sm text-gray-500 mb-1">กำลังเรียก</p>
          <p className="text-6xl font-bold text-orange-500">
            #{String(called[0].number).padStart(3, '0')}
          </p>
          {called[0].counter && (
            <p className="text-gray-600 mt-2">ช่อง {called[0].counter}</p>
          )}
        </div>
      )}

      {/* My queue */}
      {myQueue ? (
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-1 text-center">หมายเลขคิวของคุณ</p>
          <p className="text-7xl font-bold text-center text-orange-500">
            #{String(myQueue.number).padStart(3, '0')}
          </p>
          <div className="mt-4 bg-orange-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">
              มีคิวรออยู่ก่อนคุณ{' '}
              <span className="font-bold text-orange-500">
                {waiting.filter((q) => q.number < myQueue.number).length}
              </span>{' '}
              คิว
            </p>
            <p className="text-xs text-gray-400 mt-1">
              รอประมาณ {(waiting.filter((q) => q.number < myQueue.number).length * (branch?.avgWaitMinutes ?? 5))} นาที
            </p>
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            🔔 คุณจะได้รับการแจ้งเตือนเมื่อถึงคิว
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 mb-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">รับบัตรคิว</h2>
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm"
            placeholder="ชื่อ (ไม่บังคับ)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 text-sm"
            placeholder="เบอร์โทร (ไม่บังคับ)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
          />
          <button
            onClick={handleTake}
            disabled={taking || !branch?.isOpen}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 active:scale-95 transition-transform"
          >
            {taking ? 'กำลังออกบัตร...' : 'รับบัตรคิว'}
          </button>
        </div>
      )}

      {/* Waiting list */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3">
          คิวที่รออยู่ ({waiting.length})
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {waiting.slice(0, 10).map((q) => (
            <div
              key={q.id}
              className={`flex items-center justify-between px-4 py-2 rounded-lg ${
                myQueue?.id === q.id ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
              }`}
            >
              <span className="font-bold text-gray-700">
                #{String(q.number).padStart(3, '0')}
              </span>
              {myQueue?.id === q.id && (
                <span className="text-xs text-orange-500 font-medium">คุณ</span>
              )}
            </div>
          ))}
          {waiting.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">ไม่มีคิวรออยู่</p>
          )}
        </div>
      </div>
    </div>
  );
}
